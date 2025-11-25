// API 서비스 레이어
import type {
  ExternalSearchRequest,
  ExternalSearchResponse,
  InternalSearchRequest,
  InternalSearchResponse,
  UploadResponse,
  ChatRequest,
  Message,
  PaperMetadata
} from '../types/api';

// 환경 변수에서 API URL 가져오기
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const RAG_SERVER_URL = import.meta.env.VITE_RAG_SERVER_URL || 'http://localhost:8001';

export class ApiService {
  /**
   * 외부 검색 (Semantic Scholar)
   */
  static async searchExternal(
    query: string,
    limit: number = 5
  ): Promise<ExternalSearchResponse> {
    const request: ExternalSearchRequest = {
      query_text: query,
      limit
    };

    const response = await fetch(`${API_BASE_URL}/search/external`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`외부 검색 실패: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 내부 검색 (RAG)
   */
  static async searchInternal(
    query: string,
    limit: number = 5,
    similarityThreshold: number = 0.7
  ): Promise<InternalSearchResponse> {
    const request: InternalSearchRequest = {
      query_text: query,
      limit,
      similarity_threshold: similarityThreshold
    };

    const response = await fetch(`${API_BASE_URL}/search/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`내부 검색 실패: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * [추가] 문서 ID 기반 유사도 검색
   */
  static async searchSimilarity(docId: string, limit: number = 5): Promise<InternalSearchResponse> {
    const response = await fetch(`${API_BASE_URL}/search/similarity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_id: docId, limit }),
    });

    if (!response.ok) {
      throw new Error(`유사 문서 검색 실패: ${response.status}`);
    }
    return response.json();
  }


  /**
   * 채팅 스트리밍
   * Generator를 사용하여 스트리밍 데이터를 실시간으로 yield 합니다.
   */
  static async *chatStream(
    query: string,
    history: Message[],
    targetTitles?: string[]
  ): AsyncGenerator<string, void, unknown> {
    const request: ChatRequest = {
      query,
      history,
      target_titles: targetTitles
    };

    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`채팅 요청 실패: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('응답 바디가 비어있습니다.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // 청크 디코딩 후 반환
        const chunk = decoder.decode(value, { stream: true });
        yield chunk;
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 업로드된 문서 목록 조회
   */
  static async getDocuments(): Promise<any[]> {
    const response = await fetch(`${RAG_SERVER_URL}/documents?limit=50`);

    if (!response.ok) {
      throw new Error(`문서 목록 조회 실패: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 문서 메타데이터 수정
   */
  static async updatePaper(docId: string, metadata: PaperMetadata): Promise<{ message: string; id: string }> {
    const response = await fetch(`${RAG_SERVER_URL}/documents/${docId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error(`문서 수정 실패: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 문서 삭제
   */
  static async deletePaper(docId: string): Promise<{ message: string; id: string }> {
    const response = await fetch(`${RAG_SERVER_URL}/documents/${docId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`문서 삭제 실패: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 파일 업로드
   */
  static async uploadFile(file: File, metadata?: PaperMetadata): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // 메타데이터가 존재하면 FormData에 추가
    if (metadata) {
      if (metadata.title) formData.append('title', metadata.title);
      if (metadata.authors) formData.append('authors', metadata.authors);
      if (metadata.year) formData.append('year', metadata.year.toString());
    }

    const response = await fetch(`${RAG_SERVER_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`파일 업로드 실패: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * RAG 서버 통계 정보 조회
   */
  static async getStats(): Promise<{
    totalDocuments: number;
    systemStatus: string;
    timestamp: string;
  }> {
    const response = await fetch(`${RAG_SERVER_URL}/stats`);

    if (!response.ok) {
      throw new Error(`통계 조회 실패: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Central Server 상태 확인
   */
  static async healthCheck(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/`);

    if (!response.ok) {
      throw new Error(`서버 상태 확인 실패: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export default ApiService;
