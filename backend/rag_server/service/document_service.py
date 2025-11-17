# service/document_service.py
import logging
from typing import List, Optional
from fastapi import Depends, HTTPException
from pathlib import Path
from datetime import datetime, timezone

# 필요한 모델, 리포지토리, 서비스 및 팩토리 함수 임포트
from models.schemas import SimilarityResult
from repository.document_repository import DocumentRepository, get_repository
from utils.document_loader import DocumentLoader, get_document_loader
from utils.text_splitter import TextSplitter, get_splitter_service
from utils.embedder import Embedder, get_embedder
from core.config import settings

logger = logging.getLogger(__name__)

class DocumentService:
    """
    문서 처리 및 검색 관련 비즈니스 로직을 처리하는 서비스 계층.
    파일 처리 파이프라인 및 검색 기능을 제공합니다.
    """
    def __init__(self,
                 repository: DocumentRepository,
                 loader: DocumentLoader,
                 splitter: TextSplitter,
                 embedder: Embedder):
        
        if not all([repository, loader, splitter, embedder]):
             logger.critical("One or more dependencies are None during DocumentService init.")
             raise ValueError("All service dependencies are required.")
        self.repository = repository
        self.loader = loader
        self.splitter = splitter
        self.embedder = embedder
        logger.info("DocumentService initialized with dependencies.")

    # --- 문서 처리 및 저장 파이프라인 ---
    def process_and_store_document(self, file_path: Path, original_filename: str) -> List[str]:
        """주어진 파일 경로의 문서를 로드, 분할, 임베딩하고 Repository를 통해 저장"""
        logger.info(f"Starting processing pipeline for document: {original_filename} ({file_path.name})")
        try:
            # 1. 문서 로드
            content = self.loader.load_document(file_path)
            if not content: 
                 logger.warning(f"No content loaded from {original_filename}. Skipping further processing.")
                 return []

            # 2. 텍스트 분할
            chunks = self.splitter.split_text(content)
            if not chunks:
                 logger.warning(f"No text chunks generated for {original_filename}. Skipping storage.")
                 return []

            # 3. 메타데이터 준비
            metadata = {
                "title": original_filename or file_path.stem,
                "authors": "Unknown",
                "published": datetime.now(timezone.utc),
                "doi": f"uploaded_{file_path.stem}"
            }
            logger.debug(f"Prepared metadata for {original_filename}: {metadata}")

            # 4. 청크별 임베딩 생성 및 데이터 객체 리스트 생성
            processed_data_objects = []
            logger.info(f"Generating embeddings for {len(chunks)} chunks...")
            for i, chunk in enumerate(chunks):
                try:
                    # Format text specifically for the embedding model if needed
                    text_to_embed = f"{metadata.get('title', '')} [SEP] {chunk}"
                    embedding_vector = self.embedder.embed_text(text_to_embed)

                    data_object = {
                        "title": metadata.get("title", ""),
                        "content": chunk,
                        "authors": metadata.get("authors", ""),
                        "published": metadata.get("published"),
                        "doi": metadata.get('doi', f"uploaded_{metadata.get('title', 'unknown')}_{i}"),
                        "chunk_index": i,
                        "vector": embedding_vector
                    }
                    processed_data_objects.append(data_object)
                    logger.debug(f"Processed chunk {i} for {original_filename}")

                except Exception as e:
                    logger.error(f"Failed to process chunk {i} for '{metadata.get('title')}': {str(e)}", exc_info=True)
                    continue

            if not processed_data_objects:
                logger.error(f"No chunks were successfully processed for {original_filename}.")
                raise ValueError("Failed to process any chunks for the document.")

            # 5. Repository를 통해 데이터 저장
            logger.info(f"Passing {len(processed_data_objects)} processed objects to repository for storage...")
            stored_ids = self.repository.store_processed_data(processed_data_objects)
            logger.info(f"Storage initiated for {len(stored_ids)} chunks from {original_filename}")
            return stored_ids

        except ValueError as ve:
            logger.error(f"ValueError during document processing for {original_filename}: {ve}")
            raise HTTPException(status_code=400, detail=str(ve))
        except RuntimeError as rte:
             logger.error(f"Runtime error during document processing for {original_filename}: {rte}", exc_info=True)
             raise HTTPException(status_code=500, detail="Internal error during document processing")
        except Exception as e:
            logger.error(f"Unexpected error processing document {original_filename}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Unexpected internal error")

    # --- 검색 관련 메소드들 (쿼리 임베딩 포함) ---
    def search_by_text(self, query_text: str, limit: Optional[int] = None, similarity_threshold: Optional[float] = None) -> List[SimilarityResult]:
        logger.info(f"Performing text search for: '{query_text[:50]}...'")
        if not query_text:
             raise ValueError("Query text cannot be empty.")
        try:
            text_to_embed = f"user's question [SEP] {query_text}"
            query_vector = self.embedder.embed_text(text_to_embed)

            distance_threshold_value = (1.0 - similarity_threshold) if similarity_threshold is not None else None
            logger.debug(f"Calculated distance threshold: {distance_threshold_value}")

            return self.repository.search_by_vector(
                query_vector=query_vector,
                limit=limit,
                distance_threshold=distance_threshold_value
            )
        except ValueError as ve:
             logger.error(f"ValueError during text search: {ve}")
             raise HTTPException(status_code=400, detail=str(ve))
        except RuntimeError as rte:
             logger.error(f"Runtime error during text search: {rte}", exc_info=True)
             raise HTTPException(status_code=500, detail="Internal error during search")
        except Exception as e:
            logger.error(f"Unexpected error during text search: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Unexpected internal error during search")


    def search_by_title(self, title_query: str, limit: Optional[int] = None) -> List[SimilarityResult]:
        logger.info(f"Performing title search for: '{title_query}'")
        if not title_query: raise ValueError("Title query cannot be empty.")
        try:
            return self.repository.search_by_title(title_query=title_query, limit=limit)
        except ValueError as ve: raise HTTPException(status_code=400, detail=str(ve))
        except RuntimeError as rte: logger.error(f"Runtime error during title search: {rte}", exc_info=True); raise HTTPException(status_code=500, detail="Internal error during title search")
        except Exception as e: logger.error(f"Unexpected error during title search: {e}", exc_info=True); raise HTTPException(status_code=500, detail="Unexpected internal error during title search")

    def search_by_authors(self, author_query: str, limit: Optional[int] = None) -> List[SimilarityResult]:
        logger.info(f"Performing author search for: '{author_query}'")
        if not author_query: raise ValueError("Author query cannot be empty.")
        try:
            return self.repository.search_by_authors(author_query=author_query, limit=limit)
        except ValueError as ve: raise HTTPException(status_code=400, detail=str(ve))
        except RuntimeError as rte: logger.error(f"Runtime error during author search: {rte}", exc_info=True); raise HTTPException(status_code=500, detail="Internal error during author search")
        except Exception as e: logger.error(f"Unexpected error during author search: {e}", exc_info=True); raise HTTPException(status_code=500, detail="Unexpected internal error during author search")

    def get_all_documents(self, limit: Optional[int] = None) -> List[SimilarityResult]:
        logger.info(f"Fetching all documents (limit: {limit})...")
        try:
            return self.repository.get_all_documents(limit=limit)
        except RuntimeError as rte: logger.error(f"Runtime error fetching all documents: {rte}", exc_info=True); raise HTTPException(status_code=500, detail="Internal error fetching documents")
        except Exception as e: logger.error(f"Unexpected error fetching all documents: {e}", exc_info=True); raise HTTPException(status_code=500, detail="Unexpected internal error fetching documents")


# --- 팩토리 함수 ---
def get_document_service(
    repo: DocumentRepository = Depends(get_repository),
    loader: DocumentLoader = Depends(get_document_loader),
    splitter: TextSplitter = Depends(get_splitter_service),
    embedder: Embedder = Depends(get_embedder)
) -> DocumentService:
    """FastAPI Depends를 위한 DocumentService 인스턴스 반환 함수"""
    if not all([repo, loader, splitter, embedder]):
         logger.critical("Failed to get all dependencies for DocumentService.")
         raise HTTPException(status_code=503, detail="Core document service dependencies unavailable.")
    return DocumentService(
        repository=repo,
        loader=loader,
        splitter=splitter,
        embedder=embedder
    )