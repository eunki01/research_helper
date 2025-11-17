// 검색 결과 변환 서비스
import type {
  ExternalSearchResponse,
  InternalSearchResponse,
  ExternalReference,
  InternalDocumentReference
} from '../types/api';
import type {
  PaperNode,
  PaperEdge,
  PaperGraph,
  VisualizationView,
  BreadcrumbItem
} from '../types/visualization';
import type { SearchMode } from '../types/search';
import type { Paper, Author } from '../types/paper';

export class SearchService {
  /**
   * 외부 검색 응답을 시각화 뷰로 변환
   */
  static transformExternalToVisualizationView(
    response: ExternalSearchResponse,
    query: string,
    mode: SearchMode,
    seedNodeId?: string,
    parentBreadcrumbPath?: BreadcrumbItem[]
  ): VisualizationView {
    const nodes: PaperNode[] = response.references.map((ref, index) => ({
      id: ref.paperId,
      type: 'paper' as const,
      data: this.transformExternalReferenceToPaper(ref),
      position: this.generateNodePosition(index, response.references.length),
      locked: false
    }));

    // 노드 ID 집합 생성
    const nodeIds = new Set(nodes.map(node => node.id));

    // 유효한 엣지만 필터링 (source와 target이 모두 존재하는 노드여야 함)
    const edges: PaperEdge[] = response.similarity_graph
      .filter(link => nodeIds.has(link.source) && nodeIds.has(link.target))
      .map((link, index) => ({
        id: `edge-${index}`,
        source: link.source,
        target: link.target,
        type: 'similarity', // 백엔드에서 type 필드를 제공하지 않으므로 기본값 설정
        similarity: link.similarity
      }));

    const graph: PaperGraph = {
      nodes,
      edges,
      seedNodeId: seedNodeId || nodes[0]?.id,
      query,
      searchMode: mode
    };

    const viewId = `view-${Date.now()}`;
    const newBreadcrumbItem = { id: viewId, title: query, query, timestamp: new Date().toISOString() };
    
    return {
      id: viewId,
      title: query,
      graph,
      createdAt: new Date().toISOString(),
      breadcrumbPath: parentBreadcrumbPath 
        ? [...parentBreadcrumbPath, newBreadcrumbItem]
        : [
            { id: 'home', title: '홈', timestamp: new Date().toISOString() },
            newBreadcrumbItem
          ]
    };
  }

  /**
   * 내부 검색 응답을 시각화 뷰로 변환
   */
  static transformInternalToVisualizationView(
    response: InternalSearchResponse,
    query: string,
    mode: SearchMode,
    seedNodeId?: string,
    parentBreadcrumbPath?: BreadcrumbItem[]
  ): VisualizationView {
    const nodes: PaperNode[] = response.references.map((ref, index) => ({
      id: ref.paperId,
      type: 'paper' as const,
      data: this.transformInternalReferenceToPaper(ref),
      position: this.generateNodePosition(index, response.references.length),
      locked: false
    }));

    // 노드 ID 집합 생성
    const nodeIds = new Set(nodes.map(node => node.id));

    // 유효한 엣지만 필터링 (source와 target이 모두 존재하는 노드여야 함)
    const edges: PaperEdge[] = response.similarity_graph
      .filter(link => nodeIds.has(link.source) && nodeIds.has(link.target))
      .map((link, index) => ({
        id: `edge-${index}`,
        source: link.source,
        target: link.target,
        type: 'similarity', // 백엔드에서 type 필드를 제공하지 않으므로 기본값 설정
        similarity: link.similarity
      }));

    const graph: PaperGraph = {
      nodes,
      edges,
      seedNodeId: seedNodeId || nodes[0]?.id,
      query,
      searchMode: mode
    };

    const viewId = `view-${Date.now()}`;
    const newBreadcrumbItem = { id: viewId, title: query, query, timestamp: new Date().toISOString() };
    
    return {
      id: viewId,
      title: query,
      graph,
      createdAt: new Date().toISOString(),
      breadcrumbPath: parentBreadcrumbPath 
        ? [...parentBreadcrumbPath, newBreadcrumbItem]
        : [
            { id: 'home', title: '홈', timestamp: new Date().toISOString() },
            newBreadcrumbItem
          ]
    };
  }

  /**
   * ExternalReference를 Paper 타입으로 변환
   */
  private static transformExternalReferenceToPaper(ref: ExternalReference): Paper {
    const authors: Author[] = ref.authors?.map(name => ({ name })) || [];
    
    return {
      id: ref.paperId,
      title: ref.title,
      authors,
      publicationDate: ref.publicationDate,
      venue: ref.venue,
      citationCount: ref.citationCount,
      abstract: '', // ExternalReference에는 abstract가 없음
      openAccessPdf: ref.openAccessPdf,
      tldr: ref.tldr,
      fieldsOfStudy: ref.fieldsOfStudy,
      type: 'paper'
    };
  }

  /**
   * InternalDocumentReference를 Paper 타입으로 변환
   */
  private static transformInternalReferenceToPaper(ref: InternalDocumentReference): Paper {
    const authors: Author[] = ref.authors?.map(name => ({ name })) || [];
    
    // 청크 내용을 합쳐서 abstract로 사용
    const abstract = ref.chunks
      .map(chunk => chunk.chunk_content)
      .join(' ')
      .substring(0, 500) + '...'; // 길이 제한
    
    return {
      id: ref.paperId,
      title: ref.title,
      authors,
      publicationDate: ref.publicationDate,
      venue: undefined,
      citationCount: undefined,
      abstract,
      openAccessPdf: undefined,
      tldr: undefined,
      fieldsOfStudy: undefined,
      type: 'paper'
    };
  }

  /**
   * 노드 위치 생성 (화면 중앙 기준 원형 배치)
   */
  private static generateNodePosition(index: number, totalNodes: number): { x: number; y: number } {
    if (totalNodes === 1) {
      return { x: 0, y: 0 }; // 화면 중앙에 단일 노드 배치
    }

    const angle = (2 * Math.PI * index) / totalNodes;
    const radius = Math.min(150, 100 + totalNodes * 8); // 적절한 반경으로 조정
    const centerX = 0; // 화면 중앙 기준
    const centerY = 0; // 화면 중앙 기준

    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  }

  /**
   * Seed 논문 제목과 검색 쿼리 병합
   */
  static mergeQueryWithSeedPaper(query: string, seedPaperTitle?: string): string {
    if (!seedPaperTitle) {
      return query;
    }
    return `${query} ${seedPaperTitle}`;
  }
}

export default SearchService;
