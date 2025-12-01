from pydantic import BaseModel, Field
from typing import Optional, List

class SavePaperRequest(BaseModel):
    """외부 논문 라이브러리 저장 요청 모델"""
    paperId: str = Field(..., description="Semantic Scholar ID")
    title: str = Field(..., description="논문 제목")
    authors: Optional[List[str]] = Field(default=[], description="저자 목록")
    publicationDate: Optional[str] = Field(None, description="출판일 (YYYY-MM-DD)")
    abstract: Optional[str] = Field(None, description="초록 (PDF 없을 시 사용)")
    openAccessPdf: Optional[str] = Field(None, description="PDF 다운로드 URL")
    venue: Optional[str] = Field(None, description="저널/학회명")
    citationCount: Optional[int] = Field(None, description="인용 횟수")
    tldr: Optional[str] = Field(None, description="AI 요약")