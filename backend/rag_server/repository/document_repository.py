# repository/document_repository.py
from uuid import UUID
from typing import List, Optional, Dict, Any
import logging
from weaviate.classes.query import Filter, MetadataQuery
from models.schemas import SimilarityResult
from database.weaviate_db import WeaviateManager, get_db_manager
from core.config import settings
from fastapi import Depends, HTTPException

logger = logging.getLogger(__name__)

class DocumentRepository:
    def __init__(self, db_manager: WeaviateManager):
        if db_manager is None:
             logger.critical("DatabaseManager dependency is None during DocumentRepository init.")
             raise ValueError("DatabaseManager instance is required.")
        self.db_manager = db_manager
        logger.info("DocumentRepository initialized.")

    def store_processed_data(self, data_objects: List[Dict[str, Any]]) -> List[str]:
        """미리 처리된 데이터 객체(속성 + 벡터 포함) 리스트를 Weaviate에 배치 저장합니다."""
        if not data_objects:
            logger.warning("No processed data objects provided for storage.")
            return []

        try:
            collection = self.db_manager.get_collection() 
            object_ids = []
            doc_title = data_objects[0].get('title', 'Unknown Document') if data_objects else 'Empty Batch'

            logger.info(f"Starting batch storage for {len(data_objects)} objects from document '{doc_title}'...")

            with collection.batch.fixed_size(batch_size=100) as batch:
                for data_object in data_objects:
                    try:
                        properties = {k: v for k, v in data_object.items() if k != 'vector'}
                        vector = data_object.get('vector')

                        if not vector or not isinstance(vector, list):
                            logger.warning(f"Skipping chunk {properties.get('chunk_index')} for '{doc_title}' due to missing or invalid vector.")
                            continue

                        batch.add_object(
                            properties=properties,
                            vector=vector
                        )
                    
                        object_ids.append(f"{properties.get('doi', 'unknown_doi')}_{properties.get('chunk_index', -1)}")

                    except Exception as e:
                        chunk_index = data_object.get('chunk_index', 'N/A') # Access directly
                        logger.error(f"Failed to add chunk {chunk_index} for '{doc_title}' to batch: {str(e)}", exc_info=True)
                        continue # Skip failed chunk

            logger.info(f"Batch storage completed for document '{doc_title}'. Added {len(object_ids)} items to batch.")
            return object_ids

        except Exception as e:
            logger.error(f"Failed to store processed data for document '{doc_title}': {str(e)}", exc_info=True)
            raise RuntimeError(f"Database storage failed for {doc_title}") from e

    def search_by_vector(self, query_vector: List[float], limit: int = None, distance_threshold: float = None) -> List[SimilarityResult]:
        if limit is None: limit = settings.DEFAULT_SEARCH_LIMIT
        effective_distance = distance_threshold if distance_threshold is not None else (1.0 - settings.DEFAULT_SIMILARITY_THRESHOLD)
        try:
            collection = self.db_manager.get_collection()
            response = collection.query.near_vector(
                near_vector=query_vector, limit=limit, distance=effective_distance,
                return_metadata=MetadataQuery(distance=True),
                return_properties=["title", "content", "authors", "published", "doi", "chunk_index"],
                include_vector=True
            )
            results = []
            for obj in response.objects:
                distance = obj.metadata.distance if obj.metadata and obj.metadata.distance is not None else 1.0
                similarity_score = 1.0 - distance
                results.append(SimilarityResult(
                    title=obj.properties.get("title", ""), content=obj.properties.get("content", ""),
                    authors=obj.properties.get("authors", ""), published=obj.properties.get("published"),
                    doi=obj.properties.get("doi", ""), similarity_score=similarity_score, distance=distance,
                    vector=obj.vector.get("default") if obj.vector else None,
                    chunk_index=obj.properties.get("chunk_index")
                ))
            logger.info(f"Vector search completed: {len(results)} results found.")
            return results
        except Exception as e:
            logger.error(f"Vector search failed: {str(e)}", exc_info=True)
            raise RuntimeError("Database vector search failed") from e

    def search_by_title(self, title_query: str, limit: int = None) -> List[SimilarityResult]:
        if limit is None: limit = settings.DEFAULT_SEARCH_LIMIT
        try:
            collection = self.db_manager.get_collection()
            response = collection.query.fetch_objects(
                limit=limit, filters=Filter.by_property("title").like(f"*{title_query}*"),
                return_properties=["title", "content", "authors", "published", "doi", "chunk_index"],
                include_vector=True
            )
            results = []
            for obj in response.objects:
                 results.append(SimilarityResult(
                    title=obj.properties.get("title", ""), content=obj.properties.get("content", ""),
                    authors=obj.properties.get("authors", ""), published=obj.properties.get("published"),
                    doi=obj.properties.get("doi", ""), similarity_score=0.0, distance=1.0,
                    vector=obj.vector.get("default") if obj.vector else None,
                    chunk_index=obj.properties.get("chunk_index")
                ))
            logger.info(f"Title search completed ('{title_query}'): {len(results)} results found.")
            return results
        except Exception as e:
            logger.error(f"Title search failed: {str(e)}", exc_info=True)
            raise RuntimeError("Database title search failed") from e

    def search_by_authors(self, author_query: str, limit: int = None) -> List[SimilarityResult]:
        if limit is None: limit = settings.DEFAULT_SEARCH_LIMIT
        try:
            collection = self.db_manager.get_collection()
            response = collection.query.fetch_objects(
                limit=limit, filters=Filter.by_property("authors").like(f"*{author_query}*"),
                return_properties=["title", "content", "authors", "published", "doi", "chunk_index"],
                include_vector=True
            )
            results = []
            for obj in response.objects:
                results.append(SimilarityResult(
                    title=obj.properties.get("title", ""), content=obj.properties.get("content", ""),
                    authors=obj.properties.get("authors", ""), published=obj.properties.get("published"),
                    doi=obj.properties.get("doi", ""), similarity_score=0.0, distance=1.0,
                    vector=obj.vector.get("default") if obj.vector else None,
                    chunk_index=obj.properties.get("chunk_index")
                ))
            logger.info(f"Author search completed ('{author_query}'): {len(results)} results found.")
            return results
        except Exception as e:
            logger.error(f"Author search failed: {str(e)}", exc_info=True)
            raise RuntimeError("Database author search failed") from e

    def get_all_documents(self, limit: int = 100) -> List[SimilarityResult]:
        """저장된 모든 문서를 조회합니다. (최근 업로드 순)"""
        try:
            # Weaviate에서 모든 객체 조회 (메타데이터 포함)
            collection = self.db_manager.get_collection()
            response = collection.query.fetch_objects(
                limit=limit or 100,
                return_properties=["title", "content", "authors", "published", "doi", "chunk_index"],
                return_metadata=MetadataQuery(creation_time=True), # 생성 시간 메타데이터 요청
                include_vector=False # 목록 조회에는 벡터 불필요
            )

            # 메모리에서 최신순 정렬 (creation_time 기준 내림차순)
            sorted_objects = sorted(
                response.objects, 
                key=lambda x: x.metadata.creation_time if x.metadata else 0, 
                reverse=True
            )

            # 제목(Title) 기준으로 중복 제거하여 논문 목록 생성
            seen_titles = set()
            results = []

            for obj in sorted_objects:
                props = obj.properties or {}

                title = props.get("title", "Unknown")
                
                if title not in seen_titles:
                    seen_titles.add(title)
                    
                    # 결과 객체 생성
                    results.append(SimilarityResult(
                        id=str(obj.uuid),
                        title=title,
                        content=props.get("content", "")[:200], # 내용 미리보기
                        authors=props.get("authors", "Unknown"),
                        published=props.get("published"),
                        doi=props.get("doi", ""),
                        similarity_score=0.0,
                        distance=0.0,
                        vector=None,
                        chunk_index=props.get("chunk_index")
                    ))
            
            logger.info(f"Fetched all documents: {len(results)} unique papers found.")
            return results

        except Exception as e:
            logger.error(f"Failed to fetch all documents: {e}")
            raise RuntimeError(f"Database error: {e}")

    def update_document(self, doc_id: str, updates: Dict[str, Any]) -> bool:
        """문서(및 해당 문서의 모든 청크)의 메타데이터를 수정합니다."""
        try:
            collection = self.db_manager.get_collection()
            
            # 1. 원본 문서의 제목 등을 찾기 위해 해당 ID의 객체 조회
            obj = collection.query.fetch_object_by_id(doc_id)
            if not obj:
                logger.warning(f"Document with ID {doc_id} not found.")
                return False
            
            props = obj.properties or {}
            current_title = props.get("title")
            
            # 2. 동일한 제목을 가진 모든 청크(Chunk) 검색
            # (RAG는 문서를 청크로 쪼개서 저장하므로, 메타데이터 수정 시 모든 청크를 업데이트해야 함)
            if current_title:
                chunks_response = collection.query.fetch_objects(
                    filters=Filter.by_property("title").equal(current_title),
                    limit=1000
                )
                
                logger.info(f"Updating metadata for {len(chunks_response.objects)} chunks of '{current_title}'")

                # batch.add_object 대신 data.update 사용 (Merge 방식)
                # 메타데이터 수정은 빈도가 낮으므로 루프로 처리해도 안전함
                for chunk in chunks_response.objects:
                    collection.data.update(
                        uuid=chunk.uuid,
                        properties=updates
                    )
            else:
                # 제목조차 없는 손상된 데이터일 경우 ID 기반으로 단일 객체만 업데이트 시도
                collection.data.update(uuid=doc_id, properties=updates)

            return True

        except Exception as e:
            logger.error(f"Failed to update document {doc_id}: {e}", exc_info=True)
            raise RuntimeError(f"Database update failed for {doc_id}") from e

    def delete_document(self, doc_id: str) -> bool:
        """문서(및 해당 문서의 모든 청크)를 삭제합니다."""
        try:
            collection = self.db_manager.get_collection()
            
            # 1. 삭제 대상 식별 (제목 기준)
            obj = collection.query.fetch_object_by_id(doc_id)
            if not obj:
                return False
            
            props = obj.properties or {}
            target_title = props.get("title")
            
            if target_title:
                logger.info(f"Deleting all chunks for document title: '{target_title}'")
                collection.data.delete_many(
                    where=Filter.by_property("title").equal(target_title)
                )
            else:
                # 제목이 없으면 해당 ID만 삭제
                collection.data.delete_by_id(doc_id)

            return True

        except Exception as e:
            logger.error(f"Failed to delete document {doc_id}: {e}", exc_info=True)
            raise RuntimeError(f"Database deletion failed for {doc_id}") from e

# --- 팩토리 함수 ---
def get_repository(
    db: WeaviateManager = Depends(get_db_manager)
) -> DocumentRepository:
    """FastAPI Depends를 위한 DocumentRepository 인스턴스 반환 함수"""
    if db is None:
         raise HTTPException(status_code=503, detail="Database Manager is unavailable")
    return DocumentRepository(db_manager=db)