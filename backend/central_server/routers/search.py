from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
from typing import List, Dict, Any

from central_server.core.config import settings
from central_server.schemas.search import InternalSearchRequest, InternalSearchResponse, ExternalSearchRequest, ExternalSearchResponse
from central_server.services.query_service import QueryService
from central_server.core.database import get_db

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 의존성 주입을 위한 서비스 인스턴스
query_service = QueryService()

router = APIRouter(
  prefix="/search",
  tags=["search"]
)

@router.post("/internal", response_model=InternalSearchResponse)
async def search_internal_data(request: InternalSearchRequest):
    """
    내부 백엔드 서버를 통해 검색을 수행하고 LLM 답변을 반환합니다.
    """
    try:
        logger.info(f"내부 검색 요청 수신: {request.query_text}")
        response = await query_service.process_internal_search(request)
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"내부 검색 처리 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail="내부 검색 처리 중 오류가 발생했습니다.")

@router.post("/external", response_model=ExternalSearchResponse)
async def search_external_data(request: ExternalSearchRequest):
    """
    Semantic Scholar API 서버를 통해 검색을 수행하고 LLM 답변을 반환합니다.
    """
    try:
        logger.info(f"외부 검색 요청 수신: {request.query_text}")
        response = await query_service.process_external_search(request)
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"외부 검색 처리 중 오류 발생: {str(e)}")
        raise HTTPException(status_code=500, detail="외부 검색 처리 중 오류가 발생했습니다.")