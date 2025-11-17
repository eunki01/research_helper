from pydantic import BaseModel, Field
from typing import List, Optional

#공통부

class ChunkReference(BaseModel):
    """검색된 개별 청크의 상세 정보를 담는 모델"""
    chunk_content: str = Field(..., description="검색된 청크의 원문 내용")
    chunk_index: int = Field(..., description="문서 내 청크의 순서 (0부터 시작)")
    similarity_score: float = Field(..., description="사용자 질문과의 벡터 유사도 점수")

class SimilarityLink(BaseModel):
    """두 문서 간의 유사도 관계(그래프의 엣지)를 나타내는 모델"""
    source: str = Field(..., description="소스 노드의 문서 ID")
    target: str = Field(..., description="타겟 노드의 문서 ID")
    similarity: float = Field(..., description="두 문서 간의 코사인 유사도 점수")

#내부검색

class InternalSearchRequest(BaseModel):
    """내부 검색을 위한 요청 모델"""
    query_text: str = Field(..., description="사용자의 검색 질문 또는 쿼리")
    limit: int = Field(5, description="반환받을 최대 문서 청크 수")
    similarity_threshold: float = Field(0.1, description="유사도 검색 시 사용할 임계값")

class InternalDocumentReference(BaseModel):
    """그룹화된 내부 문서 참조 모델"""
    paper_id: str = Field(..., description="문서의 고유 ID (주로 DOI)")
    title: str = Field(..., description="문서의 제목 (주로 파일명)")
    authors: Optional[List[str]] = Field(None, description="문서의 저자 목록")
    publication_date: Optional[str] = Field(None, description="문서의 발행일")
    chunks: List[ChunkReference] = Field(..., description="문서 내에서 검색된 관련 청크 목록")

class InternalSearchResponse(BaseModel):
    """내부 검색 API의 최종 응답 모델"""
    query: str = Field(..., description="사용자가 요청한 원본 쿼리")
    answer: str = Field(..., description="LLM이 생성한 최종 답변 (Markdown 형식)")
    references: List[InternalDocumentReference] = Field(..., description="답변의 근거가 된 내부 문서 및 청크 목록")
    similarity_graph: List[SimilarityLink] = Field(..., description="참고 문헌 간의 유사도 관계 그래프")
    
#외부검색    

class ExternalSearchRequest(BaseModel):
    """외부 검색을 위한 요청 모델"""
    query_text: str = Field(..., description="사용자의 검색 질문 또는 쿼리")
    limit: int = Field(5, description="반환받을 최대 논문 수")
    
class ExternalReference(BaseModel):
    """외부 논문 검색 결과를 위한 Reference 모델"""
    paper_id: str = Field(..., description="Semantic Scholar의 논문 고유 ID")
    title: str = Field(..., description="논문의 제목")
    url: Optional[str] = Field(None, description="논문 상세 페이지 또는 PDF 파일 URL")
    authors: Optional[List[str]] = Field(None, description="논문의 저자 목록")
    publication_date: Optional[str] = Field(None, description="논문의 발행일")
    tldr: Optional[str] = Field(None, description="AI가 생성한 한 문장 요약 (TL;DR)")
    citation_count: Optional[int] = Field(None, description="논문의 피인용 횟수")
    venue: Optional[str] = Field(None, description="논문이 게재된 학회 또는 저널명")
    fields_of_study: Optional[List[str]] = Field(None, description="논문이 속한 연구 분야 목록")

class ExternalSearchResponse(BaseModel):
    """외부 검색 API의 최종 응답 모델"""
    query: str = Field(..., description="사용자가 요청한 원본 쿼리")
    answer: str = Field(..., description="LLM이 생성한 최종 답변")
    references: List[ExternalReference] = Field(..., description="답변의 근거가 된 외부 논문 목록")
    similarity_graph: List[SimilarityLink] = Field(..., description="참고 문헌 간의 유사도 관계 그래프")