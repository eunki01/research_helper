# core/config.py
import os
from pathlib import Path
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
DOTENV_PATH = BASE_DIR / ".env"

load_dotenv(DOTENV_PATH)

class Settings:
    # 하위 서버 URL 설정
    LOCAL_BACKEND_SERVER_URL: str = os.getenv("LOCAL_BACKEND_SERVER_URL", "http://localhost:8001")
    SS_API_SERVER_URL: str = os.getenv("SS_API_SERVER_URL", "http://localhost:8002")
    
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
    

settings = Settings()