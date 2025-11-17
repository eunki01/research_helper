# main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import List

from models import SearchRequest, SemanticScholarResult
from similarity_search import SimilaritySearcher, get_similarity_searcher
from config import settings

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI 애플리케이션 생성
app = FastAPI(
    title="Research Helper - Semantic Scholar API",
    description="Semantic Scholar API를 활용한 연구 논문 검색 시스템",
    version="1.0.0"
)

# CORS 미들웨어 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Research Helper API가 실행 중입니다"}

@app.post("/search", response_model=List[SemanticScholarResult])
async def search_documents(
    request: SearchRequest,
    searcher: SimilaritySearcher = Depends(get_similarity_searcher)
):
    # Semantic Scholar API를 활용한 텍스트 기반 문서 검색
    try:
        if not request.query_text:
            raise HTTPException(status_code=400, detail="검색할 텍스트를 입력해주세요")
        
        logger.info(f"텍스트 검색 요청 (Semantic Scholar): {request.query_text[:50]}...")
        
        # Semantic Scholar API를 통한 유사도 검색 수행
        results = searcher.search_by_text_via_api(
            query_text=request.query_text,
            limit=request.limit
        )
        
        logger.info(f"텍스트 검색 완료: {len(results)}개 결과")
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API 검색 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="검색 처리 중 오류가 발생했습니다")

@app.get("/recommendations/{paper_id}", response_model=List[SemanticScholarResult])
async def get_recommended_papers(
    paper_id: str, 
    limit: int = 5,
    searcher: SimilaritySearcher = Depends(get_similarity_searcher)
):
    # Semantic Scholar API를 활용한 추천 논문 검색
    try:
        if not paper_id:
            raise HTTPException(status_code=400, detail="추천 논문을 찾을 paperId를 입력해주세요")

        logger.info(f"추천 논문 요청: paperId={paper_id}")

        results = searcher.get_recommendations_by_paper_id(
            paper_id=paper_id,
            limit=limit
        )

        logger.info(f"추천 논문 검색 완료: {len(results)}개 결과")
        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"추천 논문 검색 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="추천 논문 처리 중 오류가 발생했습니다")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.API_HOST, port=settings.API_PORT)