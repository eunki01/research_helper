# core/config.py
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # model_config를 사용하여 .env 파일 로드 및 환경변수 우선 적용 설정
    model_config = SettingsConfigDict(env_file='.env', extra='ignore', case_sensitive=False)
    
    # 하위 서버 URL 설정
    LOCAL_BACKEND_SERVER_URL: str = "http://localhost:8001"
    SS_API_SERVER_URL: str = "http://localhost:8002"
    
    # LLM API 키
    OPENAI_API_KEY: str

    # Central Server 포트 설정
    CENTRAL_SERVER_PORT: int = 8000
    CENTRAL_SERVER_HOST: str = "0.0.0.0"
    
settings = Settings()
