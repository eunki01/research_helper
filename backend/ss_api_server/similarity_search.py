# similarity_search.py
from typing import List, Dict, Any
import logging
from fastapi import HTTPException, Depends
from models import SemanticScholarResult, EmbeddingResult, TldrResult
from config import settings
from client import SemanticScholarClient, get_semantic_scholar_client

logger = logging.getLogger(__name__)

class SimilaritySearcher:
    # 유사도 검색을 수행하는 클래스
    
    def __init__(self, client: SemanticScholarClient):
        self.client = client
        
    def _parse_paper_data(self, paper: Dict[str, Any]) -> SemanticScholarResult:
        """API 응답 딕셔너리를 SemanticScholarResult 모델로 변환하는 헬퍼 함수"""
        pdf_url = None
        if paper.get('openAccessPdf'):
            pdf_url = paper['openAccessPdf'].get('url')

        embedding_result = None
        if embedding_data := paper.get('embedding'):
            if isinstance(embedding_data, dict):
                embedding_result = EmbeddingResult(**embedding_data)

        tldr_result = None
        if tldr_data := paper.get('tldr'):
            if isinstance(tldr_data, dict) and tldr_data.get('text'):
                tldr_result = TldrResult(**tldr_data)

        return SemanticScholarResult(
            paperId=paper.get("paperId", ""),
            title=paper.get("title", ""),
            abstract=paper.get("abstract"),
            authors=paper.get("authors", []),
            publicationDate=paper.get("publicationDate"),
            openAccessPdf=pdf_url,
            embedding=embedding_result,
            tldr=tldr_result,
            citationCount=paper.get("citationCount"),
            venue=paper.get("venue"),
            fieldsOfStudy=paper.get("fieldsOfStudy")
        )

    def search_by_text_via_api(self, query_text: str, limit: int) -> List[SemanticScholarResult]:
        """
        Semantic Scholar API를 사용하여 텍스트 기반 논문 검색을 수행합니다.
        """
        # API 호출에 필요한 파라미터 정의
        search_fields = [
            "paperId", "title", "abstract", "authors", "publicationDate",
            "openAccessPdf", "embedding", "tldr", "citationCount", "venue", "fieldsOfStudy"
        ]
        sort_order = "publicationDate:desc"

        try:
            # 1. Client를 사용하여 API 호출
            papers_data = self.client.search_papers(
                query=query_text,
                limit=limit,
                fields=search_fields,
                sort=sort_order
            )

            # 2. 결과 파싱
            if len(papers_data) > limit:
                logger.warning(f"API가 {len(papers_data)}개의 결과를 반환했습니다. {limit}개로 제한합니다.")
                papers_data = papers_data[:limit]

            results = [self._parse_paper_data(paper) for paper in papers_data]
            
            logger.info(f"Semantic Scholar API 검색 완료: {len(results)}개 결과 반환")
            return results
            
        except HTTPException:
             # Client에서 발생한 HTTPException은 그대로 다시 발생
             raise
        except Exception as e:
            # 파싱 과정 등에서 발생한 예외 처리
            logger.error(f"API 검색 결과 처리 실패: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"검색 결과 처리 중 오류 발생: {str(e)}")

    def get_recommendations_by_paper_id(self, paper_id: str, limit: int) -> List[SemanticScholarResult]:
        """
        Semantic Scholar Recommendations API를 사용해 특정 논문 기반 추천 논문 리스트 조회
        """
        rec_fields = ["paperId", "title", "abstract", "authors", "year", "url", "openAccessPdf"]
        
        try:
            # 1. Client를 사용하여 API 호출
            papers_data = self.client.get_recommendations(
                paper_id=paper_id,
                limit=limit,
                fields=rec_fields
            )

            # 2. 결과 파싱
            results = [self._parse_paper_data(paper) for paper in papers_data]

            logger.info(f"추천 논문 검색 완료: {len(results)}개 결과")
            return results
            
        except HTTPException:
             # Client에서 발생한 HTTPException은 그대로 다시 발생
             raise
        except Exception as e:
            # 파싱 과정 등에서 발생한 예외 처리
            logger.error(f"API 추천 검색 실패: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"추천 논문 처리 중 오류 발생: {str(e)}")

# --- 팩토리 함수 ---
def get_similarity_searcher(
        client: SemanticScholarClient = Depends(get_semantic_scholar_client)
) -> SimilaritySearcher:
    """FastAPI Depends를 위한 SimilaritySearcher 인스턴스 반환 함수"""
    return SimilaritySearcher(client=client)