# crud/paper.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional, Tuple
from models import Paper, Author, PaperAuthor, Citation


async def get_paper_by_id(db: AsyncSession, paper_id: int) -> Optional[Paper]:
    """논문 ID로 조회"""
    result = await db.execute(
        select(Paper).where(Paper.PaperId == paper_id)
    )
    return result.scalar_one_or_none()


async def get_paper_with_authors(
    db: AsyncSession, 
    paper_id: int
) -> Optional[Tuple[Paper, List[str]]]:
    """논문과 저자 정보를 함께 조회"""
    paper = await get_paper_by_id(db, paper_id)
    if not paper:
        return None
    
    authors = await get_paper_authors(db, paper_id)
    return paper, authors


async def get_paper_authors(db: AsyncSession, paper_id: int) -> List[str]:
    """논문의 저자 목록 조회"""
    result = await db.execute(
        select(Author.Name)
        .join(PaperAuthor, Author.AuthorId == PaperAuthor.AuthorId)
        .where(PaperAuthor.PaperId == paper_id)
        .order_by(PaperAuthor.AuthorId)
    )
    return [name for name, in result]


async def search_papers(
    db: AsyncSession,
    query: str,
    year_min: Optional[int] = None,
    year_max: Optional[int] = None,
    limit: int = 20,
    offset: int = 0
) -> List[Paper]:
    """논문 검색"""
    filters = [
        or_(
            Paper.Title.ilike(f"%{query}%"),
            Paper.Abstract.ilike(f"%{query}%")
        )
    ]
    
    if year_min:
        filters.append(Paper.PublicationYear >= year_min)
    if year_max:
        filters.append(Paper.PublicationYear <= year_max)
    
    result = await db.execute(
        select(Paper)
        .where(and_(*filters))
        .order_by(Paper.CitationCount.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


async def get_paper_references(
    db: AsyncSession,
    paper_id: int,
    limit: int = 50
) -> List[Paper]:
    """논문이 인용한 논문들 (References)"""
    result = await db.execute(
        select(Paper)
        .join(Citation, Paper.PaperId == Citation.CitingPaperId)
        .where(Citation.CitingPaperId == paper_id)
        .order_by(Paper.CitationCount.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def get_paper_citations(
    db: AsyncSession,
    paper_id: int,
    limit: int = 50
) -> List[Paper]:
    """논문을 인용한 논문들 (Citations)"""
    result = await db.execute(
        select(Paper)
        .join(Citation, Paper.PaperId == Citation.CitingPaperId)
        .where(Citation.CitedPaperId == paper_id)
        .order_by(Paper.PublicationYear.desc(), Paper.CitationCount.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def get_paper_stats(db: AsyncSession, paper_id: int) -> dict:
    """논문 통계 조회"""
    paper = await get_paper_by_id(db, paper_id)
    if not paper:
        return None
    
    # Reference 수
    ref_count = await db.execute(
        select(func.count(Citation.CitedPaperId))
        .where(Citation.CitingPaperId == paper_id)
    )
    references = ref_count.scalar()
    
    # Citation 수
    cite_count = await db.execute(
        select(func.count(Citation.CitingPaperId))
        .where(Citation.CitedPaperId == paper_id)
    )
    citations = cite_count.scalar()
    
    # 저자 수
    author_count = await db.execute(
        select(func.count(PaperAuthor.AuthorId))
        .where(PaperAuthor.PaperId == paper_id)
    )
    authors = author_count.scalar()
    
    return {
        "paper_id": paper_id,
        "title": paper.Title,
        "year": paper.PublicationYear,
        "citation_count": paper.CitationCount,
        "reference_count": references,
        "direct_citations": citations,
        "author_count": authors
    }


async def get_papers_by_ids(
    db: AsyncSession,
    paper_ids: List[int]
) -> List[Paper]:
    """여러 논문 ID로 조회"""
    result = await db.execute(
        select(Paper).where(Paper.PaperId.in_(paper_ids))
    )
    return result.scalars().all()