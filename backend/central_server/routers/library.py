from fastapi import APIRouter, Depends
from schemas.library import SavePaperRequest
from services.library_service import LibraryService, get_library_service

router = APIRouter(
    prefix="/library",
    tags=["library"]
)

@router.post("/save")
async def save_paper(
    request: SavePaperRequest,
    service: LibraryService = Depends(get_library_service)
):
    """
    외부 논문을 라이브러리(RAG)에 저장합니다.
    PDF 다운로드를 시도하고, 실패 시 초록을 텍스트로 저장합니다.
    """
    print(request)
    return await service.save_paper_to_rag(request)