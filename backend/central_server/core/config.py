# core/config.py
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
DOTENV_PATH = BASE_DIR / ".env"

load_dotenv(DOTENV_PATH)

class Settings(BaseSettings):
    # model_config를 사용하여 .env 파일 로드 및 환경변수 우선 적용 설정
    model_config = SettingsConfigDict(env_file='.env', extra='ignore', case_sensitive=False)
    
    # 하위 서버 URL 설정
    LOCAL_BACKEND_SERVER_URL: str = "http://localhost:8001"
    SS_API_SERVER_URL: str = "http://localhost:8002"
    
    # LLM API 키
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    
    #보안 설정
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: str = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
    REFRESH_TOKEN_EXPIRE_MINUTES: str = os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES")
    
    #DB 설정
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    
    #redis 설정
    REDIS_URL: str = os.getenv("REDIS_URL")
    
    #SMTP 설정
    SMTP_SERVER: str = os.getenv("SMTP_SERVER")
    SMTP_PORT: str = os.getenv("SMTP_PORT")
    SMTP_USER: str = os.getenv("SMTP_USER")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD")
    

    # Central Server 포트 설정
    CENTRAL_SERVER_PORT: int = 8000
    CENTRAL_SERVER_HOST: str = "0.0.0.0"
    
settings = Settings()
