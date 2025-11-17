# main.py
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import logging
from typing import List
from contextlib import asynccontextmanager
from pathlib import Path

from core.config import settings
from models.schemas import UploadResponse, SimilarityResult, SearchRequest
from database.weaviate_db import db_manager_instance as db_manager, get_db_manager, WeaviateManager
from utils.file_handler import FileHandler, get_file_handler
from service.document_service import DocumentService, get_document_service

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# lifespan 함수
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        logger.info("Application startup: Connecting to Weaviate...")
        db_manager.connect()
        db_manager.ensure_collection_exists()
        logger.info("Application startup successful. Weaviate connected.")
        yield
    except Exception as e:
         logger.critical(f"Fatal error during application startup: {e}", exc_info=True)
         # Optionally re-raise to prevent app from starting in a bad state
         raise e
        #  yield
    finally:
        logger.info("Application shutdown: Closing Weaviate connection...")
        db_manager.close()
        logger.info("Application shutdown complete.")

# FastAPI 앱 생성
app = FastAPI(
    title="RAG File Similarity Search System",
    description="RAG system to search similar documents from uploaded files.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 미들웨어
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "RAG File Similarity Search System is running"}

@app.get("/health")
async def health_check(db: WeaviateManager = Depends(get_db_manager)):
    if not db or not db.client or not db.client.is_connected():
         logger.error("Health check failed: Database service unavailable.")
         raise HTTPException(status_code=503, detail="Database service unavailable")
    
    return {"status": "healthy", "timestamp": datetime.now(), "weaviate_connected": True}


@app.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    handler: FileHandler = Depends(get_file_handler),
    service: DocumentService = Depends(get_document_service)
):
    file_path: Path | None = None
    original_filename = file.filename if file else "unknown_file"
    logger.info(f"Received file upload request for: {original_filename}")

    try:
        # 1. Validate File (Handler)
        handler.validate_file(file)

        # 2. Save Temporarily (Handler)
        file_path = await handler.save_uploaded_file(file)

        # 3. Process and Store Document (Service)
        # Assuming sync for now:
        stored_ids = service.process_and_store_document(file_path, original_filename)

        # 4. Create Response
        response_message = f"File '{original_filename}' uploaded and processed successfully."
        if isinstance(stored_ids, list):
             response_message += f" Stored {len(stored_ids)} chunks."
        else:
             logger.warning("Processing did not return a list of stored IDs.")

        response = UploadResponse(
            filename=original_filename,
            message=response_message,
            upload_timestamp=datetime.now(timezone.utc)
        )
        logger.info(f"File upload completed successfully for: {original_filename}")
        return response

    except HTTPException as http_exc:
        logger.warning(f"HTTP Exception during upload for {original_filename}: {http_exc.status_code} - {http_exc.detail}")
        raise http_exc
    except ValueError as ve:
         logger.error(f"ValueError during upload processing for {original_filename}: {ve}", exc_info=True)
         raise HTTPException(status_code=400, detail=str(ve))
    except RuntimeError as rte:
         logger.error(f"RuntimeError during upload processing for {original_filename}: {rte}", exc_info=True)
         raise HTTPException(status_code=500, detail=f"Internal processing error: {rte}")
    except Exception as e:
        logger.error(f"Unexpected error during file upload orchestration for {original_filename}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Unexpected internal server error during file upload.")
    finally:
        # 5. Clean up temporary file
        if file_path and file_path.exists():
            try:
                file_path.unlink()
                logger.info(f"Temporary file deleted: {file_path}")
            except OSError as e:
                logger.error(f"Error deleting temporary file {file_path}: {e}")


@app.post("/search", response_model=List[SimilarityResult])
async def search_documents(
    request: SearchRequest,
    service: DocumentService = Depends(get_document_service)
):
    """Performs text-based similarity search using the DocumentService."""
    if not request.query_text:
        raise HTTPException(status_code=400, detail="query_text is required for search.")

    logger.info(f"Received text search request: '{request.query_text[:50]}...'")
    try:
        results = service.search_by_text(
            query_text=request.query_text,
            limit=request.limit,
            similarity_threshold=request.similarity_threshold
        )
        logger.info(f"Text search completed: {len(results)} results found.")
        return results
    except HTTPException:
         raise
    except ValueError as ve: 
         logger.warning(f"Invalid search request: {ve}")
         raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error during text search: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal error during search processing.")


@app.get("/stats")
async def get_stats(db: WeaviateManager = Depends(get_db_manager)):
    """Retrieves basic statistics about the document collection."""
    logger.info("Received request for stats.")
    try:
        collection = db.get_collection()
        result = collection.aggregate.over_all(total_count=True)
        document_count = result.total_count if result is not None and result.total_count is not None else 0
        logger.info(f"Retrieved stats: total_documents={document_count}")

        return {
            "total_documents": document_count,
            "system_status": "running",
            "timestamp": datetime.now(timezone.utc)
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error retrieving system statistics.")

# main 실행 부분
if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting RAG server on {settings.API_HOST}:{settings.API_PORT}")
    uvicorn.run(app, host=settings.API_HOST, port=settings.API_PORT)