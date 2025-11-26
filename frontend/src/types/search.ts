// 검색 관련 타입 정의
import type { ExternalReference, InternalDocumentReference, SimilarityLink } from './api';

export type SearchMode = 'internal' | 'external';

export interface SearchFilters {
  startYear: string;
  endYear: string;
  publicationTypes: string[];
  isOpenAccess: boolean;
  venues: string; // 콤마로 구분된 문자열 입력
  fieldsOfStudy: string[];
}

export const DEFAULT_FILTERS: SearchFilters = {
  startYear: '',
  endYear: '',
  publicationTypes: [],
  isOpenAccess: false,
  venues: '',
  fieldsOfStudy: []
};

export interface SearchQuery {
  text: string;
  mode: SearchMode;
  selectedSeedPaper?: string; // 논문 ID
  limit?: number;
  similarity_threshold?: number;
}

export interface SearchResult {
  query: string;
  answer: string;
  references: (ExternalReference | InternalDocumentReference)[];
  similarity_graph: SimilarityLink[];
  searchMode: SearchMode;
  seedNodeId?: string;
}

// Re-export from api.ts
export type { ExternalReference, InternalDocumentReference, SimilarityLink } from './api';


