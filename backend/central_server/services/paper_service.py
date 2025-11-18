# services/paper.py
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Optional
from models import Paper
from crud import paper as paper_crud
from schemas.paper import PaperResponse


class PaperService:
    """논문 관련 비즈니스 로직"""
    
    @staticmethod
    async def get_paper_with_details(
        db: AsyncSession,
        paper_id: str
    ) -> Optional[Dict]:
        """논문 상세 정보 조회 (저자, 통계 포함)"""
        paper_data = await paper_crud.get_paper_with_authors(db, paper_id)
        if not paper_data:
            return None
        
        paper, authors = paper_data
        stats = await paper_crud.get_paper_stats(db, paper_id)
        
        return {
            "paper": paper,
            "authors": authors,
            "stats": stats
        }
    
    @staticmethod
    async def search_papers_with_authors(
        db: AsyncSession,
        query: str,
        year_min: Optional[int] = None,
        year_max: Optional[int] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[PaperResponse]:
        """논문 검색 (저자 정보 포함)"""
        papers = await paper_crud.search_papers(
            db, query, year_min, year_max, limit, offset
        )
        
        results = []
        for paper in papers:
            authors = await paper_crud.get_paper_authors(db, paper.PaperId)
            results.append({
                "PaperId": paper.PaperId,
                "Title": paper.Title,
                "Year": paper.Year,
                "Abstract": paper.Abstract,
                "CitationCount": paper.CitationCount,
                "authors": authors
            })
        
        return results
    
    @staticmethod
    async def get_citation_network(
        db: AsyncSession,
        paper_id: str,
        depth: int = 1
    ) -> Dict:
        """Citation 네트워크 데이터 생성 (시각화용)"""
        if depth < 1:
            depth = 1
        
        # 중심 논문
        center_paper = await paper_crud.get_paper_by_id(db, paper_id)
        if not center_paper:
            return None
        
        nodes = {paper_id: center_paper}
        edges = []
        
        # References (이 논문이 인용한 논문들)
        references = await paper_crud.get_paper_references(db, paper_id, limit=20)
        for ref in references:
            nodes[ref.PaperId] = ref
            edges.append({
                "source": paper_id,
                "target": ref.PaperId,
                "type": "references"
            })
        
        # Citations (이 논문을 인용한 논문들)
        citations = await paper_crud.get_paper_citations(db, paper_id, limit=20)
        for cite in citations:
            nodes[cite.PaperId] = cite
            edges.append({
                "source": cite.PaperId,
                "target": paper_id,
                "type": "cites"
            })
        
        return {
            "nodes": [
                {
                    "id": pid,
                    "title": p.Title,
                    "year": p.Year,
                    "citation_count": p.CitationCount
                }
                for pid, p in nodes.items()
            ],
            "edges": edges
        }
    
    @staticmethod
    async def get_papers_with_authors_batch(
        db: AsyncSession,
        papers: List[Paper]
    ) -> List[Dict]:
        """여러 논문의 저자 정보를 일괄 조회"""
        results = []
        for paper in papers:
            authors = await paper_crud.get_paper_authors(db, paper.PaperId)
            results.append({
                "PaperId": paper.PaperId,
                "Title": paper.Title,
                "Year": paper.Year,
                "Abstract": paper.Abstract,
                "CitationCount": paper.CitationCount,
                "authors": authors
            })
        return results
    
    @staticmethod
    async def get_trending_papers(
        db: AsyncSession,
        year_min: Optional[int] = None,
        limit: int = 20
    ) -> List[Dict]:
        """트렌딩 논문 (최근 + 많이 인용됨)"""
        papers = await paper_crud.search_papers(
            db,
            query="",  # 빈 쿼리로 전체 검색
            year_min=year_min,
            limit=limit
        )
        
        return await PaperService.get_papers_with_authors_batch(db, papers)