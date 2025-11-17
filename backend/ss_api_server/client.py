# backend/ss_api_server/client.py
import requests
import logging
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from config import settings

logger = logging.getLogger(__name__)

# API 기본 URL 정의
BASE_API_URL = "https://api.semanticscholar.org/graph/v1"
RECOMMENDATIONS_API_URL = "https://api.semanticscholar.org/recommendations/v1"

class SemanticScholarClient:
    """
    Semantic Scholar API와의 통신을 담당하는 클라이언트 클래스.
    requests.Session을 사용하여 연결을 관리하고 API 키를 헤더에 포함시킵니다.
    """
    def __init__(self):
        self.session = requests.Session()
        self.api_key = settings.SEMANTIC_SCHOLAR_API_KEY
        
        if self.api_key:
            # API 키가 있으면 세션 헤더에 추가
            self.session.headers.update({"x-api-key": self.api_key})
            logger.info("SemanticScholarClient initialized with API Key.")
        else:
            logger.warning("SemanticScholarClient initialized without API Key. Rate limits may apply.")

    def _request(self, method: str, url: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        API 요청을 수행하고 예외 처리를 담당하는 내부 메소드
        """
        try:
            response = self.session.request(method=method, url=url, params=params, timeout=15.0)
            # 4xx, 5xx 에러 발생 시 HTTPError 예외 발생
            response.raise_for_status() 
            return response.json()
        except requests.exceptions.HTTPError as err:
            # API가 반환한 오류 (e.g., 400, 404, 500)
            logger.error(f"HTTP error during API request to {url}: {err.response.status_code} - {err.response.text}")
            # FastAPI가 처리할 수 있도록 HTTPException으로 변환하여 다시 발생
            raise HTTPException(status_code=err.response.status_code, detail=f"Semantic Scholar API error: {err.response.text}")
        except requests.exceptions.RequestException as e:
            # 연결 오류, 타임아웃 등
            logger.error(f"Error during API request to {url}: {e}")
            raise HTTPException(status_code=503, detail=f"Service unavailable: Failed to connect to Semantic Scholar API: {e}")

    def search_papers(self, query: str, limit: int, fields: List[str], sort: str) -> List[Dict[str, Any]]:
        """
        Semantic Scholar /paper/search API를 호출합니다.
        """
        url = f"{BASE_API_URL}/paper/search"
        params = {
            "query": query,
            "limit": limit,
            "fields": ",".join(fields),
            "openAccessPdf": "",
            "publicationDateOrYear": "2022:",
            "sort": sort,
        }
        logger.info(f"Requesting paper search: query='{query[:30]}...', limit={limit}")
        data = self._request(method="GET", url=url, params=params)
        # 'data' 키가 없거나 None일 경우 빈 리스트 반환
        return data.get("data", []) if data else []

    def get_recommendations(self, paper_id: str, limit: int, fields: List[str]) -> List[Dict[str, Any]]:
        """
        Semantic Scholar /recommendations API를 호출합니다.
        """
        url = f"{RECOMMENDATIONS_API_URL}/papers/forpaper/{paper_id}"
        params = {
            "limit": limit,
            "fields": ",".join(fields),
        }
        logger.info(f"Requesting recommendations for paper: {paper_id}, limit={limit}")
        data = self._request(method="GET", url=url, params=params)
        # 'recommendedPapers' 키가 없거나 None일 경우 빈 리스트 반환
        return data.get("recommendedPapers", []) if data else []

# --- 팩토리 함수 ---
def get_semantic_scholar_client() -> SemanticScholarClient:
    """FastAPI Depends를 위한 SemanticScholarClient 팩토리 함수"""
    # 세션을 재사용하기 위해 싱글톤으로 관리할 수도 있으나,
    # 여기서는 간단하게 요청마다 새 인스턴스를 생성합니다.
    return SemanticScholarClient()