# database/weaviate_db.py
import weaviate
from weaviate.classes.config import Configure, Property, DataType
from typing import Optional
import logging
from core.config import settings
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class WeaviateManager:
    # Weaviate 데이터베이스 연결 및 관리 클래스

    def __init__(self):
        self.client: Optional[weaviate.WeaviateClient] = None
        self.collection_name = "ResearchPapers"

    def connect(self) -> weaviate.WeaviateClient:
        # Weaviate 클라이언트에 연결
        if self.client and self.client.is_connected():
             logger.info("Weaviate client already connected.")
             return self.client
        try:
            self.client = weaviate.connect_to_local(
                host=settings.WEAVIATE_HOST,
                port=settings.WEAVIATE_PORT,
                grpc_port=settings.WEAVIATE_GRPC_PORT
            )
            logger.info("Weaviate connection successful")
            return self.client
        except Exception as e:
            logger.error(f"Weaviate connection failed: {str(e)}")
            raise

    def ensure_collection_exists(self) -> None:
        # 컬렉션이 없으면 새로 생성
        if not self.client or not self.client.is_connected():
            logger.error("Cannot ensure collection exists: Weaviate client not connected.")
            raise ValueError("Weaviate client not connected")

        try:
            if not self.client.collections.exists(self.collection_name):
                self.client.collections.create(
                    name=self.collection_name,
                    vectorizer_config=Configure.Vectorizer.none(),
                    properties=[
                        Property(name="title", data_type=DataType.TEXT),
                        Property(name="content", data_type=DataType.TEXT),
                        Property(name="authors", data_type=DataType.TEXT),
                        Property(name="published", data_type=DataType.DATE),
                        Property(name="doi", data_type=DataType.TEXT),
                        Property(name="chunk_index", data_type=DataType.NUMBER),
                    ]
                )
                logger.info(f"Collection '{self.collection_name}' created successfully.")
            else:
                logger.info(f"Collection '{self.collection_name}' already exists.")

        except Exception as e:
            logger.error(f"Collection initialization failed: {str(e)}")
            raise

    def get_collection(self):
        # 컬렉션 객체 반환
        if not self.client or not self.client.is_connected():
             logger.error("Cannot get collection: Weaviate client not connected.")
             # 연결 시도 또는 에러 발생
             try:
                 self.connect()
             except Exception:
                 raise ValueError("Weaviate client is not connected and connection attempt failed")
        # 컬렉션 존재 재확인
        if not self.client.collections.exists(self.collection_name):
             logger.warning(f"Collection '{self.collection_name}' does not exist. Trying to create it.")
             try:
                 self.ensure_collection_exists()
             except Exception as e:
                  logger.error(f"Failed to auto-create collection '{self.collection_name}': {e}")
                  raise ValueError(f"Collection '{self.collection_name}' not found and could not be created.")

        return self.client.collections.get(self.collection_name)

    def close(self) -> None:
        # 클라이언트 연결 종료
        if self.client and self.client.is_connected():
            self.client.close()
            logger.info("Weaviate connection closed.")
        else:
             logger.info("Weaviate client already closed or not connected.")


# lifespan에서 관리할 전역 인스턴스
db_manager_instance = WeaviateManager()

# --- 팩토리 함수 추가 ---
def get_db_manager() -> WeaviateManager:
    """FastAPI Depends를 위한 WeaviateManager 인스턴스 반환 함수"""
    # lifespan에서 관리되는 인스턴스 반환
    # 간단한 연결 상태 확인 추가
    if not db_manager_instance.client or not db_manager_instance.client.is_connected():
         logger.warning("DB Manager client is not connected in factory. Check lifespan.")
         raise HTTPException(status_code=503, detail="Database service unavailable")
    return db_manager_instance