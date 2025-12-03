// src/api/visualization.ts
import axios from 'axios';
import type {
  VisualizationStateResponse,
  SaveVisualizationStateRequest,
  SaveVisualizationStateResponse
} from '../types/api'

const API_BASE_URL = 'http://localhost:8000';

// Axios 인스턴스 생성 (인증 토큰 포함)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 처리
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * 시각화 상태 조회
 */
export const getVisualizationState = async (): Promise<VisualizationStateResponse> => {
  try {
    const response = await apiClient.get<VisualizationStateResponse>('/visualization/state');
    return response.data;
  } catch (error) {
    console.error('Failed to get visualization state:', error);
    throw error;
  }
};

/**
 * 시각화 상태 저장
 */
export const saveVisualizationState = async (
  state: SaveVisualizationStateRequest
): Promise<SaveVisualizationStateResponse> => {
  try {
    const response = await apiClient.post<SaveVisualizationStateResponse>(
      '/visualization/state',
      state
    );
    return response.data;
  } catch (error) {
    console.error('Failed to save visualization state:', error);
    throw error;
  }
};

/**
 * 시각화 상태 삭제
 */
export const deleteVisualizationState = async (): Promise<void> => {
  try {
    await apiClient.delete('/visualization/state');
  } catch (error) {
    console.error('Failed to delete visualization state:', error);
    throw error;
  }
};