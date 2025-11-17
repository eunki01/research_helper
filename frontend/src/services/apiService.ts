// API 서비스 레이어
import type {
  ExternalSearchRequest,
  ExternalSearchResponse,
  InternalSearchRequest,
  InternalSearchResponse,
  UploadResponse
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
   * 파일 업로드
   */
  static async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

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
