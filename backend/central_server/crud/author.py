# crud/author.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from models import Author, Paper, PaperAuthor


async def get_author_by_id(
    db: AsyncSession,
    author_id: str
) -> Optional[Author]:
    """저자 ID로 조회"""
    result = await db.execute(
        select(Author).where(Author.AuthorId == author_id)
    )
    return result.scalar_one_or_none()


async def search_authors(
    db: AsyncSession,
    query: str,
    limit: int = 20,
    offset: int = 0
) -> List[tuple[Author, int]]:
    """저자 검색 (논문 수 포함)"""
    result = await db.execute(
        select(
            Author,
            func.count(PaperAuthor.paper_id).label("paper_count")
        )
        .outerjoin(PaperAuthor, Author.AuthorId == PaperAuthor.author_id)
        .where(Author.Name.ilike(f"%{query}%"))
        .group_by(Author.AuthorId)
        .order_by(func.count(PaperAuthor.paper_id).desc())
        .limit(limit)
        .offset(offset)
    )
    return result.all()


async def get_author_papers(
    db: AsyncSession,
    author_id: str,
    limit: int = 50,
    offset: int = 0
) -> List[Paper]:
    """저자의 모든 논문"""
    result = await db.execute(
        select(Paper)
        .join(PaperAuthor, Paper.PaperId == PaperAuthor.paper_id)
        .where(PaperAuthor.author_id == author_id)
        .order_by(Paper.Year.desc(), Paper.CitationCount.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


async def get_author_stats(
    db: AsyncSession,
    author_id: str
) -> Optional[dict]:
    """저자 통계"""
    author = await get_author_by_id(db, author_id)
    if not author:
        return None
    
    # 논문 수
    paper_count = await db.execute(
        select(func.count(PaperAuthor.paper_id))
        .where(PaperAuthor.author_id == author_id)
    )
    
    # 총 인용 수
    total_citations = await db.execute(
        select(func.sum(Paper.CitationCount))
        .join(PaperAuthor, Paper.PaperId == PaperAuthor.paper_id)
        .where(PaperAuthor.author_id == author_id)
    )
    
    return {
        "author_id": author_id,
        "name": author.Name,
        "paper_count": paper_count.scalar() or 0,
        "total_citations": total_citations.scalar() or 0
    }


async def get_coauthors(
    db: AsyncSession,
    author_id: str,
    limit: int = 20
) -> List[tuple[Author, int]]:
    """공동 저자 목록 (공동 작업한 논문 수 포함)"""
    result = await db.execute(
        select(
            Author,
            func.count(PaperAuthor.paper_id).label("collaboration_count")
        )
        .join(PaperAuthor, Author.AuthorId == PaperAuthor.author_id)
        .where(
            PaperAuthor.paper_id.in_(
                select(PaperAuthor.paper_id)
                .where(PaperAuthor.author_id == author_id)
            ),
            Author.AuthorId != author_id
        )
        .group_by(Author.AuthorId)
        .order_by(func.count(PaperAuthor.paper_id).desc())
        .limit(limit)
    )
    return result.all()