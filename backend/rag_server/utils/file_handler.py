# utils/file_handler.py
import uuid
from pathlib import Path
import logging
from fastapi import UploadFile, HTTPException

# config import
from core.config import settings

logger = logging.getLogger(__name__)

class FileHandler:
    def __init__(self):
        logger.info("FileHandler initialized (stateless).")

    def validate_file(self, file: UploadFile) -> None:
        """업로드된 파일의 유효성을 검사"""
        if not file or not file.filename:
             logger.warning("Validation failed: No file or filename provided.")
             raise HTTPException(status_code=400, detail="No file provided or file has no name.")

        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in settings.ALLOWED_EXTENSIONS:
            logger.warning(f"Validation failed: Unsupported file type '{file_extension}' for {file.filename}.")
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{file_extension}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        # 파일 크기 검사
        if hasattr(file, 'size') and file.size is not None:
             if file.size == 0:
                 logger.warning(f"Validation failed: File '{file.filename}' is empty.")
                 raise HTTPException(status_code=400, detail="File cannot be empty.")
             if file.size > settings.MAX_FILE_SIZE:
                 logger.warning(f"Validation failed: File '{file.filename}' size ({file.size}) exceeds limit ({settings.MAX_FILE_SIZE}).")
                 raise HTTPException(
                    status_code=413,
                    detail=f"File size exceeds limit. Max: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
                 )
        logger.debug(f"File validation successful for {file.filename}")

    async def save_uploaded_file(self, file: UploadFile) -> Path:
        """업로드된 파일을 고유한 이름으로 임시 저장하고 경로를 반환"""
        if not file.filename: # filename 존재 재확인
             raise HTTPException(status_code=400, detail="File has no name.")

        try:
            file_extension = Path(file.filename).suffix
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = settings.UPLOAD_DIR / unique_filename

            file_path.parent.mkdir(parents=True, exist_ok=True)

            logger.info(f"Saving uploaded file '{file.filename}' temporarily to '{file_path}'...")
            content = await file.read()
            if not content:
                 # 유효성 검사 후에도 내용이 비었는지 재확인
                 logger.warning(f"Content read from '{file.filename}' is empty after validation passed. Aborting save.")
                 raise HTTPException(status_code=400, detail="File content appears to be empty.")

            with open(file_path, "wb") as f:
                f.write(content)

            logger.info(f"File '{file.filename}' temporarily saved successfully to '{file_path}'.")
            return file_path
        except HTTPException:
             raise
        except Exception as e:
            logger.error(f"Failed to save temporary file '{file.filename}': {str(e)}", exc_info=True)
            # 부분적으로 쓰여진 파일 정리 시도
            if 'file_path' in locals() and file_path.exists():
                 try: file_path.unlink()
                 except OSError: pass # 삭제 실패 시 무시
            raise HTTPException(status_code=500, detail="Error saving temporary file")

# --- 팩토리 함수 ---
def get_file_handler() -> FileHandler:
    """FastAPI Depends를 위한 FileHandler 인스턴스 반환 함수"""
    # FileHandler는 상태가 없으므로 매번 새로 생성해도 무방
    return FileHandler()