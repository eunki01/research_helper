# core/config.py
import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import logging # 로깅 추가

load_dotenv()
logger = logging.getLogger(__name__) # 로거 추가

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore', case_sensitive=False)

    # Weaviate 설정
    WEAVIATE_HOST: str = "localhost"
    WEAVIATE_PORT: int = 8080
    WEAVIATE_GRPC_PORT: int = 50051

    # 임베딩 모델 설정
    EMBEDDING_MODEL_NAME: str = "allenai/specter"
    EMBEDDING_DEVICE: str = "cpu"
    NORMALIZE_EMBEDDINGS: bool = True

    # 텍스트 분할 설정
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    # 파일 업로드 설정
    UPLOAD_DIR: Path = Path("uploads")
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set[str] = {".txt", ".pdf", ".docx", ".md"}

    # 검색 설정
    DEFAULT_SEARCH_LIMIT: int = 5
    DEFAULT_SIMILARITY_THRESHOLD: float = 0.7

    # FastAPI 설정
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8001

    def ensure_upload_dir(self):
        """업로드 디렉토리가 존재하는지 확인하고 생성"""
        try:
            upload_dir = Path(self.UPLOAD_DIR)
            upload_dir.mkdir(exist_ok=True)
            logger.info(f"Upload directory '{upload_dir}' ensured.") # 로그 추가
        except Exception as e:
            logger.error(f"Failed to ensure upload directory '{self.UPLOAD_DIR}': {e}")
            raise

# 설정 인스턴스 생성
settings = Settings()

# 업로드 디렉토리 생성 (인스턴스 생성 후 호출)
try:
    settings.ensure_upload_dir()
except Exception as e:
    logger.critical(f"Could not create upload directory on startup: {e}")
    # 필요시 여기서 애플리케이션 종료 처리