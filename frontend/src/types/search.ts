// 검색 관련 타입 정의

import type { ExternalReference, InternalDocumentReference, SimilarityLink } from './api';

export type SearchMode = 'internal' | 'external';

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


