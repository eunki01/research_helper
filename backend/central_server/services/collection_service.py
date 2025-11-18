# services/collection.py
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Optional
from crud import collection as collection_crud, paper as paper_crud
from services.recommendation_service import RecommendationService
from fastapi import HTTPException


class CollectionService:
    """컬렉션 관련 비즈니스 로직"""
    
    @staticmethod
    async def create_user_collection(
        db: AsyncSession,
        user_id: int,
        name: str,
        description: Optional[str] = None
    ):
        """사용자 컬렉션 생성"""
        return await collection_crud.create_collection(
            db, user_id, name, description
        )
    
    @staticmethod
    async def get_collection_with_papers(
        db: AsyncSession,
        collection_id: int,
        user_id: int
    ) -> Optional[Dict]:
        """컬렉션과 논문들 조회"""
        collection = await collection_crud.get_collection_by_id(
            db, collection_id, user_id
        )
        if not collection:
            return None
        
        papers = await collection_crud.get_collection_papers(db, collection_id)
        
        # 각 논문의 저자 정보 추가
        papers_with_authors = []
        for paper in papers:
            authors = await paper_crud.get_paper_authors(db, paper.PaperId)
            papers_with_authors.append({
                "PaperId": paper.PaperId,
                "Title": paper.Title,
                "Year": paper.Year,
                "Abstract": paper.Abstract,
                "CitationCount": paper.CitationCount,
                "authors": authors
            })
        
        return {
            "collection": collection,
            "papers": papers_with_authors,
            "paper_count": len(papers)
        }
    
    @staticmethod
    async def add_paper_to_collection_with_validation(
        db: AsyncSession,
        collection_id: int,
        paper_id: str,
        user_id: int
    ):
        """컬렉션에 논문 추가 (검증 포함)"""
        # 컬렉션 소유권 확인
        collection = await collection_crud.get_collection_by_id(
            db, collection_id, user_id
        )
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        
        # 논문 존재 확인
        paper = await paper_crud.get_paper_by_id(db, paper_id)
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")
        
        # 추가
        success = await collection_crud.add_paper_to_collection(
            db, collection_id, paper_id
        )
        if not success:
            raise HTTPException(
                status_code=400,
                detail="Paper already in collection"
            )
        
        return {"message": "Paper added successfully"}
    
    @staticmethod
    async def remove_paper_with_validation(
        db: AsyncSession,
        collection_id: int,
        paper_id: str,
        user_id: int
    ):
        """컬렉션에서 논문 제거 (검증 포함)"""
        collection = await collection_crud.get_collection_by_id(
            db, collection_id, user_id
        )
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        
        success = await collection_crud.remove_paper_from_collection(
            db, collection_id, paper_id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Paper not in collection"
            )
        
        return {"message": "Paper removed successfully"}
    
    @staticmethod
    async def get_collection_recommendations(
        db: AsyncSession,
        collection_id: int,
        user_id: int,
        limit: int = 20
    ) -> List[Dict]:
        """컬렉션 기반 추천"""
        collection = await collection_crud.get_collection_by_id(
            db, collection_id, user_id
        )
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        
        paper_ids = await collection_crud.get_collection_paper_ids(
            db, collection_id
        )
        
        if not paper_ids:
            return []
        
        # 추천 받기
        recommendations = await RecommendationService.get_collection_recommendations(
            db, paper_ids, limit
        )
        
        # 저자 정보 추가
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
    
    @staticmethod
    async def get_collection_stats(
        db: AsyncSession,
        collection_id: int,
        user_id: int
    ) -> Optional[Dict]:
        """컬렉션 통계"""
        collection = await collection_crud.get_collection_by_id(
            db, collection_id, user_id
        )
        if not collection:
            return None
        
        papers = await collection_crud.get_collection_papers(db, collection_id)
        
        if not papers:
            return {
                "paper_count": 0,
                "total_citations": 0,
                "year_range": None,
                "avg_citations": 0
            }
        
        total_citations = sum(p.CitationCount for p in papers)
        years = [p.Year for p in papers if p.Year]
        
        return {
            "paper_count": len(papers),
            "total_citations": total_citations,
            "year_range": {
                "min": min(years) if years else None,
                "max": max(years) if years else None
            },
            "avg_citations": total_citations / len(papers) if papers else 0
        }