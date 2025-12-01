import httpx
import logging
from fastapi import HTTPException
from schemas.library import SavePaperRequest
from core.config import settings

logger = logging.getLogger(__name__)

class LibraryService:
    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=60.0)

    async def save_paper_to_rag(self, request: SavePaperRequest) -> dict:
        """
        외부 논문을 RAG 서버에 저장합니다.
        """
        
        # 초록 유무 확인 (필수)
        if not request.abstract:
            raise HTTPException(status_code=400, detail="이 논문은 초록(Abstract)이 없어 라이브러리에 저장할 수 없습니다.")
        
        logger.info(f"Saving paper '{request.title}' using abstract.")
        
        # 텍스트 파일 생성
        file_content = request.abstract.encode('utf-8')
        
        # 파일명 생성 (특수문자 제거하여 안전하게)
        safe_title = "".join([c for c in request.title if c.isalnum() or c in (' ', '-', '_')]).strip()
        filename = f"{safe_title}.txt"
        content_type = "text/plain"

        # RAG 서버로 업로드 (Multipart)
        try:
            year = None
            if request.publicationDate:
                try:
                    year = int(request.publicationDate.split('-')[0])
                except:
                    pass

            files = {
                'file': (filename, file_content, content_type)
            }
            
            data = {
                'title': request.title,
                'authors': ", ".join(request.authors) if request.authors else "Unknown",
                'year': str(year) if year else None,
                'venue': request.venue,
                'citation_count': str(request.citationCount) if request.citationCount is not None else None,
                'tldr': request.tldr,
                'open_access_pdf': request.openAccessPdf # 링크 정보는 메타데이터로 저장 (원본 보기용)
            }
            data = {k: v for k, v in data.items() if v is not None}

            logger.info(f"Uploading to RAG Server: {filename}")
            
            response = await self.http_client.post(
                f"{settings.LOCAL_BACKEND_SERVER_URL}/upload",
                files=files,
                data=data
            )
            
            if response.status_code != 200:
                logger.error(f"RAG Upload failed: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"RAG 서버 저장 실패: {response.text}")

            return response.json()

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error during RAG upload: {e}")
            raise HTTPException(status_code=500, detail=f"저장 처리 중 오류: {str(e)}")

def get_library_service() -> LibraryService:
    return LibraryService()