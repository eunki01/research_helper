# ss_api/models.py
from pydantic import BaseModel, Field
from typing import List, Optional

class SearchRequest(BaseModel):
    """Semantic Scholar 검색을 위한 요청 모델"""
    query_text: Optional[str] = Field(None, description="검색할 텍스트 쿼리")
    limit: int = Field(5, description="반환받을 최대 논문 수")

class EmbeddingResult(BaseModel):
    """논문 임베딩 벡터 정보를 담는 모델"""
    model: str = Field(..., description="사용된 임베딩 모델의 이름")
    vector: List[float] = Field(..., description="임베딩 벡터값")

class TldrResult(BaseModel):
    """AI 생성 한 문장 요약(TL;DR) 정보를 담는 모델"""
    model: str = Field(..., description="사용된 요약 모델의 이름")
    text: Optional[str] = Field(None, description="요약된 텍스트 내용")

class SemanticScholarResult(BaseModel):
    """Semantic Scholar API로부터 받은 단일 논문 정보를 담는 모델"""
    paperId: str = Field(..., description="Semantic Scholar의 논문 고유 ID")
    title: str = Field(..., description="논문의 제목")
    abstract: Optional[str] = Field(None, description="논문의 초록")
    authors: List[dict] = Field(..., description="논문의 저자 정보 객체 목록")
    publicationDate: Optional[str] = Field(None, description="논문의 발행일")
    openAccessPdf: Optional[str] = Field(None, description="Open Access PDF 파일의 직접 링크")
    embedding: Optional[EmbeddingResult] = Field(None, description="논문의 임베딩 벡터 정보")
    tldr: Optional[TldrResult] = Field(None, description="AI 생성 한 문장 요약 정보")
    citationCount: Optional[int] = Field(None, description="논문의 피인용 횟수")
    venue: Optional[str] = Field(None, description="논문이 게재된 학회 또는 저널명")
    fieldsOfStudy: Optional[List[str]] = Field(None, description="논문이 속한 연구 분야 목록")