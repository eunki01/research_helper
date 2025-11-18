# schemas/paper.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AuthorBase(BaseModel):
    author_id: str
    name: str


class PaperBase(BaseModel):
    paper_id: str = Field(alias="PaperId")
    title: str = Field(alias="Title")
    year: Optional[int] = Field(None, alias="Year")
    abstract: Optional[str] = Field(None, alias="Abstract")
    citation_count: int = Field(alias="CitationCount")

    class Config:
        populate_by_name = True
        from_attributes = True


class PaperResponse(PaperBase):
    authors: List[str] = []


class PaperDetailResponse(PaperResponse):
    reference_count: int = 0
    citation_count_direct: int = 0


class PaperSearchParams(BaseModel):
    query: str = Field(..., min_length=1)
    year_min: Optional[int] = None
    year_max: Optional[int] = None
    limit: int = Field(20, le=100)


class PaperStatsResponse(BaseModel):
    paper_id: str
    title: str
    year: Optional[int]
    citation_count: int
    reference_count: int
    direct_citations: int
    author_count: int