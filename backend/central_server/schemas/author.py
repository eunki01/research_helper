# schemas/author.py
from pydantic import BaseModel, Field
from typing import Optional


class AuthorResponse(BaseModel):
    author_id: str
    name: str
    paper_count: int = 0

    class Config:
        from_attributes = True


class AuthorSearchParams(BaseModel):
    query: str = Field(..., min_length=2)
    limit: int = Field(20, le=100)


class AuthorDetailResponse(BaseModel):
    author_id: str
    name: str
    paper_count: int
    total_citations: int
    h_index: Optional[int] = None