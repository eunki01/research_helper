// src/hooks/useVisualizationState.ts
import { useState, useEffect, useCallback } from 'react';
import {
  getVisualizationState,
  saveVisualizationState,
  deleteVisualizationState,
} from '../services/visualizationService';
import type { 
  VisualizationState,
} from '../types/visualization';
import type {
  VisualizationStateResponse,
  SaveVisualizationStateRequest,
  SaveVisualizationStateResponse
} from '../types/api'

interface UseVisualizationStateReturn {
  state: VisualizationState;
  loading: boolean;
  error: string | null;
  loadState: () => Promise<void>;
  saveState: (newState: SaveVisualizationStateRequest) => Promise<SaveVisualizationStateResponse>;
  clearState: () => Promise<void>;
}

export const useVisualizationState = (): UseVisualizationStateReturn => {
  const [state, setState] = useState<VisualizationState>({
    currentViewIndex: 0,
    views: [],
    maxViews: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 초기 로드
  const loadState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: VisualizationStateResponse = await getVisualizationState();
      setState(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load state';
      setError(errorMessage);
      console.error('Load state error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 상태 저장
  const saveState = useCallback(async (
    newState: SaveVisualizationStateRequest
  ): Promise<SaveVisualizationStateResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await saveVisualizationState(newState);
      setState(newState); // 로컬 상태도 업데이트
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save state';
      setError(errorMessage);
      console.error('Save state error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 상태 삭제
  const clearState = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await deleteVisualizationState();
      setState({
        currentViewIndex: 0,
        views: [],
        maxViews: 10,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear state';
      setError(errorMessage);
      console.error('Clear state error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


  return {
    state,
    loading,
    error,
    loadState,
    saveState,
    clearState,
  };
};