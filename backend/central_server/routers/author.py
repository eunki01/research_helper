# routers/author.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from core.database import get_db
from schemas.author import AuthorResponse, AuthorDetailResponse
from schemas.paper import PaperResponse
from crud import author as author_crud
from services.paper_service import PaperService

router = APIRouter(prefix="/authors", tags=["authors"])


@router.get("/search", response_model=List[AuthorResponse])
async def search_authors(
    query: str = Query(..., min_length=2, description="Author name to search"),
    limit: int = Query(20, le=100, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: AsyncSession = Depends(get_db)
):
    """저자 검색"""
    authors_with_count = await author_crud.search_authors(
        db, query, limit, offset
    )
    
    return [
        {
            "author_id": author.AuthorId,
            "name": author.Name,
            "paper_count": paper_count
        }
        for author, paper_count in authors_with_count
    ]


@router.get("/{author_id}", response_model=AuthorDetailResponse)
async def get_author_detail(
    author_id: str,
    db: AsyncSession = Depends(get_db)
):
    """저자 상세 정보"""
    stats = await author_crud.get_author_stats(db, author_id)
    
    if not stats:
        raise HTTPException(status_code=404, detail="Author not found")
    
    return {
        **stats,
        "h_index": None  # TODO: h-index 계산 구현
    }


@router.get("/{author_id}/papers", response_model=List[PaperResponse])
async def get_author_papers(
    author_id: str,
    limit: int = Query(50, le=200, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: AsyncSession = Depends(get_db)
):
    """저자의 모든 논문"""
    papers = await author_crud.get_author_papers(
        db, author_id, limit, offset
    )
    
    return await PaperService.get_papers_with_authors_batch(db, papers)


@router.get("/{author_id}/coauthors", response_model=List[AuthorResponse])
async def get_coauthors(
    author_id: str,
    limit: int = Query(20, le=100, description="Maximum results"),
    db: AsyncSession = Depends(get_db)
):
    """공동 저자 목록"""
    coauthors_with_count = await author_crud.get_coauthors(
        db, author_id, limit
    )
    
    return [
        {
            "author_id": author.AuthorId,
            "name": author.Name,
            "paper_count": collaboration_count
        }
        for author, collaboration_count in coauthors_with_count
    ]