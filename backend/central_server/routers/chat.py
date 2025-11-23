# backend/central_server/routers/chat.py
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from schemas.chat import ChatRequest
from services.query_service import QueryService, get_query_service

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    query_service: QueryService = Depends(get_query_service)
):
    """
    질문과 이전 대화 기록을 받아 LLM 답변을 스트리밍합니다.
    """
    return StreamingResponse(
        query_service.chat_stream(
            query=request.query, 
            history=request.history,
            target_paper_ids=request.target_paper_ids
        ),
        media_type="text/event-stream"
    )