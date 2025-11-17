# utils/document_loader.py
import logging
from pathlib import Path
from langchain_community.document_loaders import (
    TextLoader, PyPDFLoader, UnstructuredWordDocumentLoader
)

logger = logging.getLogger(__name__)

class DocumentLoader:
    """파일 경로를 받아 내용을 텍스트로 로드하는 컴포넌트"""

    def load_document(self, file_path: Path) -> str:
        """파일 확장자에 따라 적절한 로더를 사용하여 문서 내용을 로드"""
        file_extension = file_path.suffix.lower()
        logger.info(f"Loading document: {file_path.name} (type: {file_extension})")

        try:
            if file_extension == ".txt":
                loader = TextLoader(str(file_path), encoding='utf-8')
            elif file_extension == ".pdf":
                loader = PyPDFLoader(str(file_path))
            elif file_extension in [".docx", ".doc"]:
                loader = UnstructuredWordDocumentLoader(str(file_path))
            elif file_extension == ".md":
                loader = TextLoader(str(file_path), encoding='utf-8') # Or a specific Markdown loader
            else:
                raise ValueError(f"Unsupported file type: {file_extension}. Allowed types: .txt, .pdf, .docx, .doc")

            docs = loader.load()

            content = "\n".join([doc.page_content for doc in docs if doc.page_content and isinstance(doc.page_content, str)]).strip()

            if not content:
                 logger.warning(f"No content extracted from {file_path.name}. The file might be empty or unreadable.")
                 return ""

            logger.info(f"Successfully loaded content from: {file_path.name}")
            return content

        except FileNotFoundError:
             logger.error(f"File not found: {file_path}")
             raise 
        except ValueError as ve:
             logger.error(str(ve))
             raise 
        except ImportError as ie:
             logger.error(f"Missing dependency for file type {file_extension}: {ie}. Please install required libraries.")
             raise RuntimeError(f"Missing dependency for {file_extension}: {ie}") from ie
        except Exception as e:
            logger.error(f"Failed to load document {file_path.name} due to unexpected error: {str(e)}", exc_info=True)
            raise RuntimeError(f"Failed to load document {file_path.name}") from e

# --- 팩토리 함수 추가 ---
def get_document_loader() -> DocumentLoader:
    """FastAPI Depends를 위한 DocumentLoader 인스턴스 반환 함수"""
    return DocumentLoader()