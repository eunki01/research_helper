# backend/central_server/schemas/chat.py
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class Message(BaseModel):
    """대화 메시지 모델"""
    role: str = Field(..., description="메시지 발신자 역할 (user/assistant/system)")
    content: str = Field(..., description="메시지 내용")

class ChatRequest(BaseModel):
    """채팅 스트리밍 요청 모델"""
    query: str = Field(..., description="사용자의 질문")
    history: List[Message] = Field([], description="이전 대화 기록")
    target_paper_ids: List[str] = Field([], description="특정 논문을 대상으로 할 경우 해당 논문 ID 목록")