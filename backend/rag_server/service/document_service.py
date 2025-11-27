import logging
from typing import List, Optional, Dict, Any
from fastapi import Depends, HTTPException
from pathlib import Path
from datetime import datetime, timezone

from models.schemas import SimilarityResult
from repository.document_repository import DocumentRepository, get_repository
from utils.document_loader import DocumentLoader, get_document_loader
from utils.text_splitter import TextSplitter, get_splitter_service
from utils.embedder import Embedder, get_embedder

logger = logging.getLogger(__name__)

class DocumentService:
    def __init__(self, repository: DocumentRepository, loader: DocumentLoader, splitter: TextSplitter, embedder: Embedder):
        if not all([repository, loader, splitter, embedder]):
             raise ValueError("All service dependencies are required.")
        self.repository = repository
        self.loader = loader
        self.splitter = splitter
        self.embedder = embedder

    def process_and_store_document(self, file_path: Path, original_filename: str, metadata: Optional[Dict[str, Any]] = None) -> List[str]:
        try:
            content = self.loader.load_document(file_path)
            if not content:
                logger.warning(f"No content extracted from {file_path}")
                return []
            
            chunks = self.splitter.split_text(content)
            if not chunks:
                logger.warning(f"No chunks created from {file_path}")
                return []

            final_metadata = {
                "title": original_filename or file_path.stem,
                "authors": "Unknown",
                "published": datetime.now(timezone.utc),
                "doi": f"uploaded_{file_path.stem}",
                "venue": None,
                "citation_count": None,
                "tldr": None,
                "open_access_pdf": None
            }

            if metadata:
                if metadata.get("title"): final_metadata["title"] = metadata["title"]
                if metadata.get("authors"): final_metadata["authors"] = metadata["authors"]
                if metadata.get("year"):
                    try:
                        year_val = int(metadata["year"])
                        final_metadata["published"] = datetime(year_val, 1, 1, tzinfo=timezone.utc)
                    except (ValueError, TypeError):
                        pass

                if metadata.get("venue"): final_metadata["venue"] = metadata["venue"]
                if metadata.get("citation_count"): final_metadata["citation_count"] = metadata["citation_count"]
                if metadata.get("tldr"): final_metadata["tldr"] = metadata["tldr"]
                if metadata.get("open_access_pdf"): final_metadata["open_access_pdf"] = metadata["open_access_pdf"]

            processed_data_objects = []
            for i, chunk in enumerate(chunks):
                try:
                    # 제목과 내용을 함께 임베딩하여 문맥 정보 강화
                    text_to_embed = f"{final_metadata.get('title', '')} [SEP] {chunk}"
                    embedding_vector = self.embedder.embed_text(text_to_embed)
                    
                    data_object = {
                        "title": final_metadata.get("title", ""),
                        "content": chunk,
                        "authors": final_metadata.get("authors", ""),
                        "published": final_metadata.get("published"),
                        "doi": final_metadata.get('doi', f"uploaded_{final_metadata.get('title', 'unknown')}_{i}"),
                        "chunk_index": i,
                        "vector": embedding_vector,
                        "venue": final_metadata.get("venue"),
                        "citation_count": final_metadata.get("citation_count"),
                        "tldr": final_metadata.get("tldr"),
                        "open_access_pdf": final_metadata.get("open_access_pdf")
                    }
                    processed_data_objects.append(data_object)
                except Exception as e:
                    logger.error(f"Error creating data object for chunk {i}: {e}")
                    continue

            if not processed_data_objects:
                raise ValueError("Failed to process any chunks.")

            return self.repository.store_processed_data(processed_data_objects)

        except Exception as e:
            logger.error(f"Error processing document: {e}")
            raise HTTPException(status_code=500, detail=f"Internal error processing document: {str(e)}")

    def search_by_text(
        self, 
        query_text: str, 
        limit: Optional[int] = None, 
        similarity_threshold: Optional[float] = None,
        target_titles: Optional[List[str]] = None
    ) -> List[SimilarityResult]:
        """
        통합 검색을 수행합니다.
        Weaviate의 Hybrid Search를 사용하여 벡터 유사도와 키워드 매칭(제목, 저자 등)을 동시에 고려합니다.
        """
        logger.info(f"Performing unified (hybrid) search for: '{query_text[:50]}...' (Targets: {len(target_titles) if target_titles else 'All'})")
        
        if not query_text:
             raise ValueError("Query text cannot be empty.")
        
        try:
            # 벡터 생성을 위한 텍스트
            text_to_embed = f"user's question [SEP] {query_text}"
            query_vector = self.embedder.embed_text(text_to_embed)

            distance_threshold_value = (1.0 - similarity_threshold) if similarity_threshold is not None else None

            # text_query 파라미터 전달 (Hybrid Search 활성화)
            return self.repository.search_by_vector(
                query_vector=query_vector,
                limit=limit,
                distance_threshold=distance_threshold_value,
                target_titles=target_titles,
                text_query=query_text  # 텍스트 쿼리 전달
            )
        except Exception as e:
            logger.error(f"Unexpected error during text search: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Unexpected internal error during search")

    def search_by_document_id(
        self, 
        doc_id: str, 
        limit: Optional[int] = 5,
        similarity_threshold: Optional[float] = None
    ) -> List[SimilarityResult]:
        logger.info(f"Performing document similarity search for ID: {doc_id}")
        
        # 1. 대상 문서의 벡터와 제목 조회
        result = self.repository.get_vector_and_title_by_id(doc_id)
        
        if not result:
            logger.warning(f"Document with ID {doc_id} not found.")
            raise HTTPException(status_code=404, detail="Reference document not found or has no vector.")
        
        query_vector, query_title = result
        
        logger.info(f"Reference document found: '{query_title}'. Searching for similar documents...")

        distance_threshold_value = (1.0 - similarity_threshold) if similarity_threshold is not None else None

        # 2. [변경] Over-fetching: 요청된 limit보다 더 많은 청크를 검색 (예: 4배)
        # 이유: 자기 자신의 청크가 상위권을 독점하는 것을 방지하고, 다양한 문서를 확보하기 위함
        fetch_limit = (limit or 5) * 4
        
        # 3. [변경] exclude_titles 제거: 자기 자신도 결과에 포함시켜야 시각화 그래프에 노드가 생성됨
        raw_results = self.repository.search_by_vector(
            query_vector=query_vector,
            limit=fetch_limit, 
            distance_threshold=distance_threshold_value,
            exclude_titles=None # 제외 안 함
        )

        # 4. 문서 다양성 필터링 (Document Diversity Filtering)
        # 목표: 상위 'limit'개의 *고유한 문서*를 찾고, 그 문서들에 속한 청크들을 반환
        
        unique_titles = [] # 순서 유지하며 고유 제목 저장
        title_to_chunks = {} # 제목별 청크 그룹화

        for res in raw_results:
            if res.title not in title_to_chunks:
                if len(unique_titles) < (limit or 5): # 원하는 문서 개수만큼만 문서를 수집
                    unique_titles.append(res.title)
                    title_to_chunks[res.title] = []
            
            # 이미 선정된 문서에 속한 청크라면 추가
            if res.title in title_to_chunks:
                title_to_chunks[res.title].append(res)

        # 5. 최종 결과 구성 (선정된 문서들의 청크들을 유사도 순으로 평탄화)
        final_results = []
        for res in raw_results:
            if res.title in title_to_chunks:
                final_results.append(res)
        
        logger.info(f"Document search complete. Fetched {len(raw_results)} chunks, returning {len(final_results)} chunks from {len(unique_titles)} unique docs.")

        return final_results

    def get_all_documents(self, limit: int = 100) -> List[SimilarityResult]:
        return self.repository.get_all_documents(limit=limit)

    def update_document(self, doc_id: str, update_data: Dict[str, Any]) -> bool:
        logger.info(f"Request to update document {doc_id} with {update_data}")
        updates = {k: v for k, v in update_data.items() if v is not None}
        
        if 'year' in updates:
            try:
                year_val = int(updates.pop('year'))
                updates['published'] = datetime(year_val, 1, 1, tzinfo=timezone.utc)
            except (ValueError, TypeError):
                pass

        return self.repository.update_document(doc_id, updates)

    def delete_document(self, doc_id: str) -> bool:
        logger.info(f"Request to delete document {doc_id}")
        return self.repository.delete_document(doc_id)

def get_document_service(
    repo: DocumentRepository = Depends(get_repository),
    loader: DocumentLoader = Depends(get_document_loader),
    splitter: TextSplitter = Depends(get_splitter_service),
    embedder: Embedder = Depends(get_embedder)
) -> DocumentService:
    return DocumentService(repo, loader, splitter, embedder)