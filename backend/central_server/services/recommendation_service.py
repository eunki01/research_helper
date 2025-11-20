# services/recommendation.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Dict, Tuple
from models import Paper, Citation, Author, PaperAuthor
from crud import paper as paper_crud


class RecommendationService:
    """논문 추천 서비스"""
    
    @staticmethod
    async def get_similar_papers_by_co_citation(
        db: AsyncSession,
        paper_id: int,
        limit: int = 10,
        exclude_ids: List[int] = None
    ) -> List[Tuple[Paper, float, int]]:
        """공동 인용 기반 유사 논문 추천"""
        exclude_ids = exclude_ids or []
        exclude_ids.append(paper_id)
        
        # 1. 이 논문이 인용한 논문들
        cited_by_target = await db.execute(
            select(Citation.CitedPaperId)
            .where(Citation.CitingPaperId == paper_id)
        )
        cited_ids = [id for id, in cited_by_target]
        
        if not cited_ids:
            return []
        
        # 2. 같은 논문들을 인용한 다른 논문들
        result = await db.execute(
            select(
                Paper,
                func.count(Citation.CitedPaperId).label("common_citations")
            )
            .join(Citation, Paper.PaperId == Citation.CitingPaperId)
            .where(
                and_(
                    Citation.CitedPaperId.in_(cited_ids),
                    Paper.PaperId.notin_(exclude_ids)
                )
            )
            .group_by(Paper.PaperId)
            .order_by(func.count(Citation.CitedPaperId).desc())
            .limit(limit)
        )
        
        recommendations = []
        for paper, common_count in result:
            score = float(common_count) / len(cited_ids)
            reason = f"Shares {common_count} references with the selected paper"
            recommendations.append((paper, score, reason))
        
        return recommendations
    
    @staticmethod
    async def get_similar_papers_by_bibliographic_coupling(
        db: AsyncSession,
        paper_id: int,
        limit: int = 10,
        exclude_ids: List[int] = None
    ) -> List[Tuple[Paper, float, int]]:
        """서지결합 기반 유사 논문 추천 (같은 논문을 참조하는 논문들)"""
        exclude_ids = exclude_ids or []
        exclude_ids.append(paper_id)
        
        # 1. 이 논문을 인용한 논문들
        citing_papers = await db.execute(
            select(Citation.CitingPaperId)
            .where(Citation.CitedPaperId == paper_id)
        )
        citing_ids = [id for id, in citing_papers]
        
        if not citing_ids:
            return []
        
        # 2. 이 논문들이 인용한 다른 논문들
        result = await db.execute(
            select(
                Paper,
                func.count(Citation.CitingPaperId).label("common_citations")
            )
            .join(Citation, Paper.PaperId == Citation.CitedPaperId)
            .where(
                and_(
                    Citation.CitingPaperId.in_(citing_ids),
                    Paper.PaperId.notin_(exclude_ids)
                )
            )
            .group_by(Paper.PaperId)
            .order_by(func.count(Citation.CitingPaperId).desc())
            .limit(limit)
        )
        
        recommendations = []
        for paper, common_count in result:
            score = float(common_count) / len(citing_ids)
            reason = f"Cited by {common_count} papers that also cite the selected paper"
            recommendations.append((paper, score, reason))
        
        return recommendations
    
    @staticmethod
    async def get_collection_recommendations(
        db: AsyncSession,
        collection_paper_ids: List[int],
        limit: int = 20
    ) -> List[Tuple[Paper, float, int]]:
        """컬렉션 기반 추천 (컬렉션 논문들이 많이 인용한 논문)"""
        if not collection_paper_ids:
            return []
        
        # 컬렉션 논문들이 인용한 논문들
        result = await db.execute(
            select(
                Paper,
                func.count(Citation.CitingPaperId).label("citation_count")
            )
            .join(Citation, Paper.PaperId == Citation.CitedPaperId)
            .where(
                and_(
                    Citation.CitingPaperId.in_(collection_paper_ids),
                    Paper.PaperId.notin_(collection_paper_ids)
                )
            )
            .group_by(Paper.PaperId)
            .order_by(func.count(Citation.CitingPaperId).desc())
            .limit(limit)
        )
        
        recommendations = []
        for paper, count in result:
            score = float(count) / len(collection_paper_ids)
            reason = f"Cited by {count} papers in your collection"
            recommendations.append((paper, score, reason))
        
        return recommendations
    
    @staticmethod
    async def get_recent_papers_in_field(
        db: AsyncSession,
        paper_id: int,
        years: int = 2,
        limit: int = 10
    ) -> List[Tuple[Paper, float, int]]:
        """최근 관련 논문 추천"""
        # 해당 논문이 인용한 논문들의 최근 인용 논문
        target_paper = await paper_crud.get_paper_by_id(db, paper_id)
        if not target_paper or not target_paper.PublicationYear:
            return []
        
        min_year = target_paper.PublicationYear - years
        
        # 참조 논문들
        cited_ids = await db.execute(
            select(Citation.CitedPaperId)
            .where(Citation.CitingPaperId == paper_id)
        )
        cited_list = [id for id, in cited_ids]
        
        if not cited_list:
            return []
        
        # 이 참조 논문들을 인용한 최근 논문들
        result = await db.execute(
            select(Paper)
            .join(Citation, Paper.PaperId == Citation.CitingPaperId)
            .where(
                and_(
                    Citation.CitedPaperId.in_(cited_list),
                    Paper.PublicationYear >= min_year,
                    Paper.PaperId != paper_id
                )
            )
            .order_by(Paper.PublicationYear.desc(), Paper.CitationCount.desc())
            .limit(limit)
        )
        
        recommendations = []
        for paper in result.scalars():
            score = 1.0 - (target_paper.PublicationYear - paper.PublicationYear) / years if paper.PublicationYear else 0.5
            reason = f"Recent paper ({paper.PublicationYear}) citing related work"
            recommendations.append((paper, score, reason))
        
        return recommendations
    
    @staticmethod
    async def get_author_recommendations(
        db: AsyncSession,
        author_id: int,
        limit: int = 10
    ) -> List[Tuple[Paper, float, int]]:
        """저자 기반 추천 (해당 저자의 다른 논문들)"""
        # 저자의 최근 논문들
        result = await db.execute(
            select(Paper)
            .join(PaperAuthor, Paper.PaperId == PaperAuthor.PaperId)
            .where(PaperAuthor.AuthorId == author_id)
            .order_by(Paper.PublicationYear.desc(), Paper.CitationCount.desc())
            .limit(limit)
        )
        
        recommendations = []
        for paper in result.scalars():
            # 저자 이름 가져오기
            author_result = await db.execute(
                select(Author.Name)
                .where(Author.AuthorId == author_id)
            )
            author_name = author_result.scalar()
            
            score = 0.9  # 같은 저자이므로 높은 점수
            reason = f"By the same author: {author_name}"
            recommendations.append((paper, score, reason))
        
        return recommendations