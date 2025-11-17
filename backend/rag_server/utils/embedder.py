# utils/embedder.py
import logging
from typing import List
from fastapi import HTTPException
from langchain_huggingface import HuggingFaceEmbeddings
from core.config import settings

logger = logging.getLogger(__name__)

class Embedder:
    """
    텍스트 임베딩 생성을 담당하는 컴포넌트.
    HuggingFace 모델을 직접 로드하고 관리.
    """

    def __init__(self):
        self.model: HuggingFaceEmbeddings | None = None
        logger.info("Initializing Embedder...")
        try:
            self._initialize_model()
        except Exception as e:
            logger.critical(f"Fatal error initializing Embedder: {e}", exc_info=True)
            # 초기화 실패 시 인스턴스 생성이 실패하도록 예외 발생
            raise RuntimeError(f"Failed to initialize embedding model: {e}") from e
        logger.info("Embedder initialized successfully.")

    def _initialize_model(self) -> None:
        """HuggingFace 임베딩 모델을 초기화합니다."""
        if self.model:
            logger.info("Embedding model already initialized.")
            return

        logger.info(f"Initializing embedding model: {settings.EMBEDDING_MODEL_NAME} on device: {settings.EMBEDDING_DEVICE}")
        try:
            self.model = HuggingFaceEmbeddings(
                model_name=settings.EMBEDDING_MODEL_NAME,
                model_kwargs={'device': settings.EMBEDDING_DEVICE},
                encode_kwargs={'normalize_embeddings': settings.NORMALIZE_EMBEDDINGS}
            )
            
            logger.info(f"Embedding model '{settings.EMBEDDING_MODEL_NAME}' initialized successfully.")
        except Exception as e:
            logger.error(f"Embedding model initialization failed: {str(e)}", exc_info=True)
            raise

    def embed_text(self, text: str) -> List[float]:
        """단일 텍스트를 임베딩 벡터로 변환합니다."""
        if not self.model:
            # 초기화 실패 시 에러
            logger.error("Embedding model not initialized before embedding text.")
            raise ValueError("Embedding model not initialized")
        if not text:
            logger.warning("Attempted to embed empty text.")
            raise ValueError("Cannot embed empty text.")

        try:
            vector = self.model.embed_query(text)
            logger.debug(f"Successfully embedded text starting with: '{text[:30]}...'")
            return vector
        except Exception as e:
            logger.error(f"Text embedding failed: {str(e)}", exc_info=True)
            raise RuntimeError("Embedding generation failed") from e

    def embed_documents(self, documents: List[str]) -> List[List[float]]:
        """여러 텍스트(문서)를 임베딩 벡터 리스트로 변환합니다."""
        if not self.model:
            logger.error("Embedding model not initialized before embedding documents.")
            raise ValueError("Embedding model not initialized")
        if not documents:
            logger.warning("Attempted to embed empty list of documents.")
            return []

        try:
            vectors = self.model.embed_documents(documents)
            logger.info(f"Successfully embedded {len(documents)} documents.")
            return vectors
        except Exception as e:
            logger.error(f"Failed to embed documents: {str(e)}", exc_info=True)
            raise RuntimeError("Bulk embedding generation failed") from e

# --- 전역 인스턴스 생성 및 팩토리 함수 ---
# Embedder는 초기화 시 모델을 로드하므로 싱글톤으로 관리
try:
    embedder_instance = Embedder()
except RuntimeError as e:
     logger.critical(f"Could not create Embedder instance on startup: {e}")
     embedder_instance = None # 실패 시 None으로 설정

def get_embedder() -> Embedder:
    """FastAPI Depends를 위한 Embedder 인스턴스 반환 함수"""
    if embedder_instance is None:
        # 초기화 실패 시 에러 발생
        raise HTTPException(status_code=503, detail="Embedder is unavailable.")
    return embedder_instance