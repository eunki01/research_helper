# models/schemas.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from dataclasses import dataclass

class SimilarityResult(BaseModel):
    """유사도 검색 결과로 반환되는 단일 청크 정보를 담는 모델"""
    title: str = Field(..., description="원본 문서의 제목")
    content: str = Field(..., description="청크의 텍스트 원문")
    authors: str = Field(..., description="원본 문서의 저자")
    published: Optional[datetime] = Field(None, description="원본 문서의 발행일")
    doi: str = Field(..., description="원본 문서의 DOI")
    similarity_score: float = Field(..., description="쿼리와의 유사도 점수 (1 - distance)")
    distance: float = Field(..., description="쿼리 벡터와의 거리")
    chunk_index: Optional[int] = Field(None, description="문서 내 청크의 순서")
    vector: Optional[List[float]] = Field(None, description="청크의 임베딩 벡터")

class UploadResponse(BaseModel):
    """파일 업로드 성공 시 반환되는 응답 모델"""
    filename: str = Field(..., description="업로드된 파일의 원본 이름")
    message: str = Field(..., description="처리 결과 상태 메시지")
    upload_timestamp: datetime = Field(..., description="업로드 시점의 타임스탬프")

@dataclass
class ProcessedDocument:
    # 데이터 처리용 클래스로 API 명세에는 직접 노출되지 않음
    title: str
    content: str
    authors: str
    published: Optional[datetime]
    doi: str
    embedding: List[float]

class SearchRequest(BaseModel):
    """RAG 서버의 텍스트 검색을 위한 요청 모델"""
    query_text: Optional[str] = Field(None, description="검색할 텍스트 쿼리")
    limit: int = Field(5, description="반환받을 최대 결과 수")
    similarity_threshold: float = Field(0.7, description="유사도 점수 임계값 (0.0 ~ 1.0)")