import type { LibraryPaper } from '../types/paper';

const LIBRARY_STORAGE_KEY = 'research_navigator_library';

export class LibraryService {
  /**
   * 로컬 스토리지에서 라이브러리 데이터 가져오기
   */
  static getLibraryPapers(): LibraryPaper[] {
    try {
      const stored = localStorage.getItem(LIBRARY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load library papers:', error);
      return [];
    }
  }

  /**
   * 라이브러리 데이터를 로컬 스토리지에 저장
   */
  static saveLibraryPapers(papers: LibraryPaper[]): void {
    try {
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(papers));
    } catch (error) {
      console.error('Failed to save library papers:', error);
    }
  }

  /**
   * 새 논문 추가
   */
  static addPaper(paper: Omit<LibraryPaper, 'id' | 'uploadedAt'>): LibraryPaper {
    const papers = this.getLibraryPapers();
    const newPaper: LibraryPaper = {
      ...paper,
      id: `paper-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      uploadedAt: new Date().toISOString()
    };
    
    papers.push(newPaper);
    this.saveLibraryPapers(papers);
    return newPaper;
  }

  /**
   * 논문 삭제
   */
  static removePaper(paperId: string): boolean {
    const papers = this.getLibraryPapers();
    const filteredPapers = papers.filter(paper => paper.id !== paperId);
    
    if (filteredPapers.length !== papers.length) {
      this.saveLibraryPapers(filteredPapers);
      return true;
    }
    return false;
  }

  /**
   * 논문 정보 업데이트
   */
  static updatePaper(paperId: string, updates: Partial<LibraryPaper>): LibraryPaper | null {
    const papers = this.getLibraryPapers();
    const paperIndex = papers.findIndex(paper => paper.id === paperId);
    
    if (paperIndex !== -1) {
      papers[paperIndex] = { ...papers[paperIndex], ...updates };
      this.saveLibraryPapers(papers);
      return papers[paperIndex];
    }
    return null;
  }

  /**
   * 논문 검색
   */
  static searchPapers(query: string): LibraryPaper[] {
    const papers = this.getLibraryPapers();
    const lowercaseQuery = query.toLowerCase();
    
    return papers.filter(paper => 
      paper.title.toLowerCase().includes(lowercaseQuery) ||
      paper.authors.some(author => 
        author.name.toLowerCase().includes(lowercaseQuery)
      ) ||
      paper.abstract?.toLowerCase().includes(lowercaseQuery) ||
      paper.fieldsOfStudy?.some(field => 
        field.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  /**
   * 논문 ID로 찾기
   */
  static getPaperById(paperId: string): LibraryPaper | null {
    const papers = this.getLibraryPapers();
    return papers.find(paper => paper.id === paperId) || null;
  }

  /**
   * 라이브러리 통계
   */
  static getLibraryStats(): {
    totalPapers: number;
    totalAuthors: number;
    uniqueFields: string[];
    oldestPaper?: LibraryPaper;
    newestPaper?: LibraryPaper;
  } {
    const papers = this.getLibraryPapers();
    
    if (papers.length === 0) {
      return {
        totalPapers: 0,
        totalAuthors: 0,
        uniqueFields: []
      };
    }

    const allAuthors = papers.flatMap(paper => paper.authors);
    const uniqueAuthors = new Set(allAuthors.map(author => author.name));
    
    const allFields = papers.flatMap(paper => paper.fieldsOfStudy || []);
    const uniqueFields = Array.from(new Set(allFields));

    const sortedByDate = papers
      .filter(paper => paper.publicationDate)
      .sort((a, b) => new Date(a.publicationDate!).getTime() - new Date(b.publicationDate!).getTime());

    return {
      totalPapers: papers.length,
      totalAuthors: uniqueAuthors.size,
      uniqueFields,
      oldestPaper: sortedByDate[0],
      newestPaper: sortedByDate[sortedByDate.length - 1]
    };
  }
}
