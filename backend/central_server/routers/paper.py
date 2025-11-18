# routers/paper.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from core.database import get_db
from utils.get_current_user import get_current_user
from schemas.paper import (
    PaperResponse,
    PaperDetailResponse,
    PaperSearchParams,
    PaperStatsResponse
)
from services.recommendation_service import RecommendationService
from services.paper_service import PaperService
from crud import paper as paper_crud

router = APIRouter(prefix="/papers", tags=["papers"])


@router.get("/search", response_model=List[PaperResponse])
async def search_papers(
    query: str = Query(..., min_length=1, description="Search query"),
    year_min: Optional[int] = Query(None, description="Minimum year"),
    year_max: Optional[int] = Query(None, description="Maximum year"),
    limit: int = Query(20, le=100, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: AsyncSession = Depends(get_db)
):
    """논문 검색"""
    papers = await PaperService.search_papers_with_authors(
        db, query, year_min, year_max, limit, offset
    )
    return papers


@router.get("/trending", response_model=List[PaperResponse])
async def get_trending_papers(
    year_min: Optional[int] = Query(None, description="Minimum year"),
    limit: int = Query(20, le=100, description="Maximum results"),
    db: AsyncSession = Depends(get_db)
):
    """트렌딩 논문 (최근 + 많이 인용됨)"""
    papers = await PaperService.get_trending_papers(db, year_min, limit)
    return papers


@router.get("/{paper_id}", response_model=PaperDetailResponse)
async def get_paper_detail(
    paper_id: str,
    db: AsyncSession = Depends(get_db)
):
    """논문 상세 정보"""
    paper_data = await PaperService.get_paper_with_details(db, paper_id)
    if not paper_data:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    paper = paper_data["paper"]
    authors = paper_data["authors"]
    stats = paper_data["stats"]
    
    return {
        "PaperId": paper.PaperId,
        "Title": paper.Title,
        "Year": paper.Year,
        "Abstract": paper.Abstract,
        "CitationCount": paper.CitationCount,
        "authors": authors,
        "reference_count": stats["reference_count"],
        "citation_count_direct": stats["direct_citations"]
    }


@router.get("/{paper_id}/stats", response_model=PaperStatsResponse)
async def get_paper_stats(
    paper_id: str,
    db: AsyncSession = Depends(get_db)
):
    """논문 통계"""
    stats = await paper_crud.get_paper_stats(db, paper_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Paper not found")
    return stats


@router.get("/{paper_id}/references", response_model=List[PaperResponse])
async def get_paper_references(
    paper_id: str,
    limit: int = Query(50, le=200, description="Maximum results"),
    db: AsyncSession = Depends(get_db)
):
    """논문이 인용한 논문들 (References)"""
    papers = await paper_crud.get_paper_references(db, paper_id, limit)
    return await PaperService.get_papers_with_authors_batch(db, papers)


@router.get("/{paper_id}/citations", response_model=List[PaperResponse])
async def get_paper_citations(
    paper_id: str,
    limit: int = Query(50, le=200, description="Maximum results"),
    db: AsyncSession = Depends(get_db)
):
    """논문을 인용한 논문들 (Citations)"""
    papers = await paper_crud.get_paper_citations(db, paper_id, limit)
    return await PaperService.get_papers_with_authors_batch(db, papers)


@router.get("/{paper_id}/similar")
async def get_similar_papers(
    paper_id: str,
    algorithm: str = Query("co_citation", description="Recommendation algorithm"),
    limit: int = Query(10, le=50, description="Maximum results"),
    db: AsyncSession = Depends(get_db)
):
    """유사 논문 추천"""
    if algorithm == "co_citation":
        recommendations = await RecommendationService.get_similar_papers_by_co_citation(
            db, paper_id, limit
        )
    elif algorithm == "bibliographic_coupling":
        recommendations = await RecommendationService.get_similar_papers_by_bibliographic_coupling(
            db, paper_id, limit
        )
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid algorithm. Choose 'co_citation' or 'bibliographic_coupling'"
        )
    
    results = []
    for paper, score, reason in recommendations:
        authors = await paper_crud.get_paper_authors(db, paper.PaperId)
        results.append({
            "paper": {
                "PaperId": paper.PaperId,
                "Title": paper.Title,
                "Year": paper.Year,
                "Abstract": paper.Abstract,
                "CitationCount": paper.CitationCount,
                "authors": authors
            },
            "score": score,
            "reason": reason
        })
    
    return results


@router.get("/{paper_id}/network")
async def get_citation_network(
    paper_id: str,
    depth: int = Query(1, ge=1, le=2, description="Network depth"),
    db: AsyncSession = Depends(get_db)
):
    """Citation 네트워크 (시각화용)"""
    network = await PaperService.get_citation_network(db, paper_id, depth)
    if not network:
        raise HTTPException(status_code=404, detail="Paper not found")
    return network