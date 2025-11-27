// 논문 및 저자 관련 타입 정의

export interface Paper {
  id: string;
  title: string;
  authors: Author[];
  type: 'paper' | 'author';
  publicationDate?: string;
  abstract?: string;
  venue?: string;           
  citationCount?: number;   
  tldr?: string;           
  openAccessPdf?: string;   
  fieldsOfStudy?: string[];
}

export interface LibraryPaper extends Paper {
  uploadedAt: string;
  filePath?: string;
  isSeed?: boolean;
}

export interface Author {
  name: string;
  id?: string;
  affiliation?: string;
  publication_count?: number;
  citation_count?: number;
}

export interface PaperNode {
  id: string;
  type: 'paper' | 'author';
  data: Paper | LibraryPaper;
  position?: { x: number; y: number };
  locked?: boolean;
}

export interface PaperEdge {
  id: string;
  source: string;
  target: string;
  type: 'citation' | 'similarity';
  similarity: number;
}

export interface PaperGraph {
  nodes: PaperNode[];
  edges: PaperEdge[];
  seedNodeId?: string;
  query?: string;
  searchMode?: 'internal' | 'external';
}



