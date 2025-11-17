# config.py
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore', case_sensitive=False)

    # 검색 설정
    DEFAULT_SEARCH_LIMIT: int = 5
    DEFAULT_SIMILARITY_THRESHOLD: float = 0.7

    # FastAPI 설정
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8002 # SS API 서버 포트 번호

    # Semantic Scholar API 키 (환경 변수 또는 .env 파일)
    SEMANTIC_SCHOLAR_API_KEY: str | None = None # Optional로 변경하여 없어도 실행 가능

# 설정 인스턴스 생성
settings = Settings()