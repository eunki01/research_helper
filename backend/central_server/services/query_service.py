# services/query_service.py
import httpx
import logging
import datetime
from typing import List, Dict, Any
from fastapi import HTTPException, Depends
from collections import defaultdict
from schemas.search import (
    InternalSearchRequest, ExternalSearchRequest,
    InternalSearchResponse, InternalDocumentReference, ChunkReference,
    ExternalSearchResponse, ExternalReference,
    SimilarityLink
)

from core.config import settings
from services.llm_service import LLMService, get_llm_service # LLM 서비스와 팩토리 함수 import
from services.similarity_service import SimilarityService, get_similarity_service # 유사도 서비스와 팩토리 함수 import

logger = logging.getLogger(__name__)

class QueryService:
    def __init__(self, llm_service: LLMService, similarity_service: SimilarityService):
        self.http_client = httpx.AsyncClient(timeout=30.0) # http_client는 여기서 관리
        self.llm_service = llm_service
        self.similarity_service = similarity_service

    async def process_internal_search(self, request: InternalSearchRequest) -> InternalSearchResponse:
        """
        내부 검색 파이프라인을 실행하고 최종 응답을 반환합니다.
        """
        try:
            # 1. 내부 RAG 서버에 검색 요청
            response = await self.http_client.post(
                f"{settings.LOCAL_BACKEND_SERVER_URL}/search",
                json=request.model_dump()
            )
            response.raise_for_status()
            search_results = response.json()
            
            # 2. LLM 컨텍스트 구성 및 답변 생성
            context = self._build_internal_context(search_results)
            llm_answer = await self.llm_service.get_final_response(context, request.query_text)

            # 3. 최종 응답 데이터 구성 (references)
            # 청크를 문서(DOI) 기준으로 그룹화
            grouped_references = defaultdict(lambda: {"chunks": [], "meta": {}})
            
            for doc_chunk in search_results:
                doc_id = doc_chunk.get('doi')
                if not doc_id:
                    continue

                # 청크 정보 생성
                chunk_ref = ChunkReference(
                    chunk_content=doc_chunk.get('content'),
                    chunk_index=doc_chunk.get('chunk_index'),
                    similarity_score=doc_chunk.get('similarity_score')
                )
                grouped_references[doc_id]["chunks"].append(chunk_ref)

                # 메타데이터는 한 번만 저장
                if not grouped_references[doc_id]["meta"]:
                    publication_date = doc_chunk.get('published')
                    authors = []
                    if author_str := doc_chunk.get('authors'):
                        authors = [name.strip() for name in author_str.split(',')]
                    
                    grouped_references[doc_id]["meta"] = {
                        "title": doc_chunk.get('title'),
                        "authors": authors,
                        "publication_date": publication_date
                    }

            # 그룹화된 데이터를 최종 응답 모델 리스트로 변환
            references = []
            for doc_id, data in grouped_references.items():
                references.append(
                    InternalDocumentReference(
                        paperId=doc_id,
                        title=data["meta"]["title"],
                        authors=data["meta"]["authors"],
                        publicationDate=data["meta"]["publication_date"],
                        chunks=sorted(data["chunks"], key=lambda c: c.chunk_index) # 청크 순서대로 정렬
                    )
                )
            
            # 4. 논문 간 유사도 계산
            papers_for_similarity = [{"paperId": ref.paperId, "embedding": doc.get("vector")} for ref, doc in zip(references, search_results) if doc.get("vector")]
            similarity_graph_data = self.similarity_service.calculate_similarity_graph(papers_for_similarity)
            similarity_graph = [SimilarityLink(**link) for link in similarity_graph_data]
            
            
            # 5. 최종 응답 반환
            return InternalSearchResponse( # InternalSearchResponse 모델로 반환
                query=request.query_text,
                answer=llm_answer,
                references=references,
                similarity_graph=similarity_graph
            )
        
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"내부 서버 오류: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"내부 검색 처리 중 오류 발생: {str(e)}")

    async def process_external_search(self, request: ExternalSearchRequest) -> ExternalSearchResponse:
        """
        외부 검색 파이프라인을 실행하고 최종 응답을 반환합니다.
        """
        try:
            # 1. 쿼리 확장
            expanded_query = await self.llm_service.expand_query(request.query_text)
            logger.info(f"원본 쿼리: '{request.query_text}' -> 확장된 쿼리: '{expanded_query}'")

            # 2. 외부 ss_api 서버에 검색 요청
            response = await self.http_client.post(
                f"{settings.SS_API_SERVER_URL}/search",
                json={"query_text": expanded_query, "limit": request.limit}
            )
            response.raise_for_status()
            search_results = response.json()
            
            # 3. LLM 컨텍스트 구성 및 답변 생성
            context = self._build_external_context(search_results)
            logger.info(f"--- LLM 컨텍스트 시작 ---\n{context[:500]}\n--- LLM 컨텍스트 끝 ---")
            llm_answer = await self.llm_service.get_final_response(context, request.query_text)
            
            # 4. 최종 응답 데이터 구성 (references)
            references = []
            for paper in search_results:
                # tldr이 딕셔너리 형태일 경우 text만 추출
                tldr_text = None
                if tldr_data := paper.get('tldr'):
                    tldr_text = tldr_data.get('text')

                references.append(
                    ExternalReference( # ExternalReference 모델 사용
                        paperId=paper.get('paperId', ''),
                        title=paper.get('title', '제목 없음'),
                        openAccessPdf=paper.get('openAccessPdf'),
                        authors=[author['name'] for author in paper.get('authors', []) if 'name' in author],
                        publicationDate=paper.get('publicationDate'),
                        tldr=tldr_text,
                        citationCount=paper.get('citationCount'),
                        venue=paper.get('venue'),
                        fieldsOfStudy=paper.get('fieldsOfStudy')
                    )
                )

            # 5. 논문 간 유사도 계산
            papers_for_similarity = [{"paperId": ref.paperId, "embedding": paper.get("embedding", {}).get("vector")} for ref, paper in zip(references, search_results) if paper.get("embedding", {}).get("vector")]
            similarity_graph_data = self.similarity_service.calculate_similarity_graph(papers_for_similarity)
            similarity_graph = [SimilarityLink(**link) for link in similarity_graph_data]

            # 6. 최종 응답 반환
            return ExternalSearchResponse( # ExternalSearchResponse 모델로 반환
                query=request.query_text,
                answer=llm_answer,
                references=references,
                similarity_graph=similarity_graph
            )
        
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"외부 서버 오류: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"외부 검색 처리 중 오류 발생: {str(e)}")

    def _build_internal_context(self, chunks: List[Dict[str, Any]]) -> str:
        """내부 검색 결과를 LLM 컨텍스트로 구성"""
        return "\n\n---\n\n".join([chunk.get("content", "") for chunk in chunks])

    def _build_external_context(self, papers: List[Dict[str, Any]]) -> str:
        """외부 논문 검색 결과를 LLM 컨텍스트로 구성"""
        context_parts = []
        for paper in papers:
            title = paper.get('title', '제목 없음'),
            authors = ", ".join([author.get('name', '알 수 없음') for author in paper.get('authors', [])]),
            publication_date = paper.get('publicationDate', '알 수 없음')
            abstract = paper.get('abstract', '초록 없음'),
            
            context_parts.append(f"제목: {title}\n저자: {authors}\n출판일: {publication_date}\n\n초록:\n{abstract}")
        
        return "\n\n---\n\n".join(context_parts)

# --- 팩토리 함수 추가 ---
def get_query_service(
    llm_service: LLMService = Depends(get_llm_service),
    similarity_service: SimilarityService = Depends(get_similarity_service)
) -> QueryService:
    """FastAPI Depends를 위한 QueryService 인스턴스 반환 함수"""
    return QueryService(llm_service=llm_service, similarity_service=similarity_service)