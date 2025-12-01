# repository/document_repository.py
from typing import List, Optional, Dict, Tuple, Any
import logging
from weaviate.classes.query import Filter, MetadataQuery
from models.schemas import SimilarityResult
from database.weaviate_db import WeaviateManager, get_db_manager
from core.config import settings
from fastapi import HTTPException, Depends

logger = logging.getLogger(__name__)

class DocumentRepository:
    def __init__(self, db_manager: WeaviateManager):
        if db_manager is None:
             logger.critical("DatabaseManager dependency is None during DocumentRepository init.")
             raise ValueError("DatabaseManager instance is required.")
        self.db_manager = db_manager
        logger.info("DocumentRepository initialized.")

    def store_processed_data(self, data_objects: List[Dict[str, Any]]) -> List[str]:
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
                        chunk_index = data_object.get('chunk_index', 'N/A')
                        logger.error(f"Failed to add chunk {chunk_index} for '{doc_title}' to batch: {str(e)}", exc_info=True)
                        continue

            logger.info(f"Batch storage completed for document '{doc_title}'. Added {len(object_ids)} items to batch.")
            return object_ids

        except Exception as e:
            logger.error(f"Failed to store processed data for document '{doc_title}': {str(e)}", exc_info=True)
            raise RuntimeError(f"Database storage failed for {doc_title}") from e

    def get_vector_and_title_by_id(self, doc_id: str) -> Optional[Tuple[List[float], str]]:
        try:
            collection = self.db_manager.get_collection()
            # include_vector=True로 벡터 데이터까지 함께 조회
            obj = collection.query.fetch_object_by_id(
                doc_id, 
                include_vector=True,
                return_properties=["title"]
            )
            if obj and obj.vector:
                vector = obj.vector.get("default")
                title = obj.properties.get("title", "")
                return vector, title
            return None
        except Exception as e:
            logger.error(f"Failed to fetch vector for doc {doc_id}: {e}")
            return None

    def search_by_vector(
        self, 
        query_vector: List[float], 
        limit: int = None, 
        distance_threshold: float = None,
        target_titles: Optional[List[str]] = None,
        exclude_titles: Optional[List[str]] = None, # 제외할 제목 목록
        text_query: str = None # 텍스트 검색어 (Hybrid Search용)
    ) -> List[SimilarityResult]:
        if limit is None: limit = settings.DEFAULT_SEARCH_LIMIT
        
        # 하이브리드 검색에서는 distance threshold 대신 score를 사용하거나 후처리가 필요할 수 있음
        # 여기서는 limit 위주로 동작
        
        try:
            collection = self.db_manager.get_collection()
            
            # 1. 필터 구성 (선택된 파일 내 검색)
            search_filter = None
            if target_titles and len(target_titles) > 0:
                search_filter = Filter.by_property("title").contains_any(target_titles)

            if exclude_titles and len(exclude_titles) > 0:
                if len(exclude_titles) == 1:
                    exclude_filter = Filter.by_property("title").not_equal(exclude_titles[0])
                else:
                    exclude_filter = ~Filter.by_property("title").contains_any(exclude_titles)
                
                if search_filter:
                    search_filter = search_filter & exclude_filter
                else:
                    search_filter = exclude_filter

            # 2. 검색 실행 (Hybrid or Near Vector)
            properties_to_return = [
                "title", "content", "authors", "published", "doi", "chunk_index",
                "venue", "citation_count", "tldr", "open_access_pdf"
            ]
            
            if text_query:
                # [Hybrid Search] 벡터 + 키워드(제목, 본문, 저자 등 모든 텍스트 필드) 통합 검색
                # alpha=0.5는 벡터와 키워드 검색 결과를 균형있게 반영함
                logger.info(f"Executing Hybrid Search for: '{text_query}'")
                response = collection.query.hybrid(
                    query=text_query,
                    vector=query_vector,
                    alpha=0.5, 
                    limit=limit,
                    filters=search_filter,
                    return_metadata=MetadataQuery(score=True, distance=True),
                    return_properties=properties_to_return,
                    include_vector=True
                )
            else:
                # [Near Vector] 기존 벡터 전용 검색 (텍스트 쿼리가 없을 때)
                logger.info("Executing Near Vector Search")
                response = collection.query.near_vector(
                    near_vector=query_vector, 
                    limit=limit, 
                    distance=distance_threshold,
                    filters=search_filter,
                    return_metadata=MetadataQuery(distance=True),
                    return_properties=properties_to_return,
                    include_vector=True
                )
            
            results = []
            for obj in response.objects:
                props = obj.properties or {}
                
                # Hybrid 검색 시 score가 반환됨, near_vector 시 distance가 반환됨
                distance = obj.metadata.distance if obj.metadata.distance is not None else 0.0
                
                # Hybrid score는 정규화된 값이 아닐 수 있으므로 참고용으로 사용하거나
                # distance가 있으면 그것으로 유사도를 계산
                similarity_score = 1.0 - distance if distance is not None else (obj.metadata.score or 0.0)

                results.append(SimilarityResult(
                    id=str(obj.uuid),
                    title=props.get("title", ""), 
                    content=props.get("content", ""),
                    authors=props.get("authors", ""), 
                    published=props.get("published"),
                    doi=props.get("doi", ""), 
                    similarity_score=similarity_score, 
                    distance=distance,
                    vector=obj.vector.get("default") if obj.vector else None,
                    chunk_index=props.get("chunk_index"),
                    venue=props.get("venue"),
                    citation_count=props.get("citation_count"), 
                    tldr=props.get("tldr"),
                    open_access_pdf=props.get("open_access_pdf")
                ))
                
            logger.info(f"Search completed. Found {len(results)} items.")
            return results

        except Exception as e:
            logger.error(f"Search failed: {str(e)}", exc_info=True)
            raise RuntimeError("Database search failed") from e

    def get_all_documents(self, limit: Optional[int] = 100) -> List[SimilarityResult]:
        try:
            collection = self.db_manager.get_collection()
            response = collection.query.fetch_objects(
                limit=limit or 100,
                return_properties=[
                    "title", "content", "authors", "published", "doi", "chunk_index",
                    "venue", "citation_count", "tldr", "open_access_pdf"
                ],
                return_metadata=MetadataQuery(creation_time=True),
                include_vector=False
            )
            sorted_objects = sorted(
                response.objects, 
                key=lambda x: x.metadata.creation_time if x.metadata else 0, 
                reverse=True
            )
            seen_titles = set()
            results = []
            for obj in sorted_objects:
                props = obj.properties or {} 
                title = props.get("title", "Unknown")
                if title not in seen_titles:
                    seen_titles.add(title)
                    results.append(SimilarityResult(
                        id=str(obj.uuid),
                        title=title,
                        content=props.get("content", "")[:200],
                        authors=props.get("authors", "Unknown"),
                        published=props.get("published"),
                        doi=props.get("doi", ""),
                        similarity_score=0.0, distance=0.0, vector=None,
                        chunk_index=props.get("chunk_index"),
                        venue=props.get("venue"),
                        citation_count=props.get("citation_count"), 
                        tldr=props.get("tldr"),
                        open_access_pdf=props.get("open_access_pdf")
                    ))
            logger.info(f"Fetched all documents: {len(results)} unique papers found.")
            return results
        except Exception as e:
            logger.error(f"Failed to fetch all documents: {str(e)}", exc_info=True)
            raise RuntimeError(f"Database error: {e}")

    def update_document(self, doc_id: str, updates: Dict[str, Any]) -> bool:
        try:
            collection = self.db_manager.get_collection()
            obj = collection.query.fetch_object_by_id(doc_id)
            if not obj: return False
            props = obj.properties or {}
            current_title = props.get("title")
            if current_title:
                chunks_response = collection.query.fetch_objects(
                    filters=Filter.by_property("title").equal(current_title),
                    limit=1000
                )
                for chunk in chunks_response.objects:
                    collection.data.update(uuid=chunk.uuid, properties=updates)
            else:
                collection.data.update(uuid=doc_id, properties=updates)
            return True
        except Exception as e:
            logger.error(f"Failed to update document {doc_id}: {e}", exc_info=True)
            raise RuntimeError(f"Database update failed for {doc_id}") from e

    def delete_document(self, doc_id: str) -> bool:
        try:
            collection = self.db_manager.get_collection()
            obj = collection.query.fetch_object_by_id(doc_id)
            if not obj: return False
            props = obj.properties or {}
            target_title = props.get("title")
            if target_title:
                collection.data.delete_many(where=Filter.by_property("title").equal(target_title))
            else:
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