# main.py
from fastapi import FastAPI, HTTPException
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
    version="1.0.0"
)

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

@app.post("/search/internal", response_model=InternalSearchResponse)
async def search_internal_data(request: InternalSearchRequest):
    """
    내부 백엔드 서버를 통해 검색을 수행하고 LLM 답변을 반환합니다.
    """
    try:
        logger.info(f"내부 검색 요청 수신: {request.query_text}")
        q_service = get_query_service(llm_service=get_llm_service(), similarity_service=get_similarity_service())
        response = await q_service.process_internal_search(request)
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"내부 검색 처리 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail="내부 검색 처리 중 오류가 발생했습니다.")

@app.post("/search/external", response_model=ExternalSearchResponse)
async def search_external_data(request: ExternalSearchRequest):
    """
    Semantic Scholar API 서버를 통해 검색을 수행하고 LLM 답변을 반환합니다.
    """
    try:
        logger.info(f"외부 검색 요청 수신: {request.query_text}")
        q_service = get_query_service(llm_service=get_llm_service(), similarity_service=get_similarity_service())
        response = await q_service.process_external_search(request)
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"외부 검색 처리 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail="외부 검색 처리 중 오류가 발생했습니다.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.CENTRAL_SERVER_HOST, port=settings.CENTRAL_SERVER_PORT)