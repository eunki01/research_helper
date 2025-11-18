# main.py
from fastapi import FastAPI, HTTPException
from routers import users, search, collection, paper, author
from core.database import lifespan
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import List, Dict, Any

from core.config import settings
from core.models import InternalSearchRequest, ExternalSearchRequest, InternalSearchResponse, ExternalSearchResponse
from services.query_service import QueryService ,get_query_service
from services.llm_service import get_llm_service
from services.similarity_service import get_similarity_service

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Central Processing Server",
    description="중앙에서 검색 및 LLM 처리를 담당하는 서버",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(users.router)
app.include_router(collection.router)
app.include_router(paper.router)
app.include_router(author.router)
app.include_router(search.router)

# CORS 미들웨어 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경에서는 모든 origin 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "중앙 처리 서버가 실행 중입니다."}


    
    

