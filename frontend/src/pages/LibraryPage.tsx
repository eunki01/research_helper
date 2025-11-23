import React, { useState, useEffect, useMemo } from 'react';
import ApiService from '../services/apiService';
import PaperUploadForm from '../components/library/PaperUploadForm';
import PaperEditModal from '../components/library/PaperEditModal';
import ChatPanel from '../components/chat/ChatPanel';
import type { LibraryPaper } from '../types/paper';

interface LibraryPageProps {
  onPaperSelect?: (paper: LibraryPaper) => void;
  onClose?: () => void;
}

const LibraryPage: React.FC<LibraryPageProps> = ({
  onPaperSelect,
  onClose
}) => {
  // 상태 관리
  const [papers, setPapers] = useState<LibraryPaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  
  // UI 모드 및 모달 상태
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [editingPaper, setEditingPaper] = useState<LibraryPaper | null>(null);

  // 1. 논문 목록 불러오기
  const fetchPapers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const docs = await ApiService.getDocuments();
      
      // 백엔드 데이터(SimilarityResult) -> 프론트엔드 타입(LibraryPaper) 변환
      const formattedPapers: LibraryPaper[] = docs.map((doc: any) => ({
        id: doc.id || doc.doi, // UUID 사용
        title: doc.title,
        authors: doc.authors 
          ? doc.authors.split(',').map((name: string) => ({ name: name.trim() })) 
          : [{ name: 'Unknown' }],
        type: 'paper',
        publicationDate: doc.published,
        abstract: doc.content,
        uploadedAt: doc.published || new Date().toISOString(),
        fieldsOfStudy: [], // 현재 백엔드에서 지원하지 않음
        isSeed: false
      }));

      setPapers(formattedPapers);
    } catch (err) {
      console.error('Failed to fetch papers:', err);
      setError('논문 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchPapers();
  }, []);

  // 2. 검색 필터링
  const filteredPapers = useMemo(() => {
    if (!searchQuery) return papers;
    const lowerQuery = searchQuery.toLowerCase();
    return papers.filter(paper => 
      paper.title.toLowerCase().includes(lowerQuery) ||
      paper.authors.some(a => a.name.toLowerCase().includes(lowerQuery))
    );
  }, [papers, searchQuery]);

  // 3. 통계 계산 (Memoization)
  const stats = useMemo(() => {
    const uniqueAuthors = new Set(papers.flatMap(p => p.authors.map(a => a.name)));
    return {
      totalPapers: papers.length,
      totalAuthors: uniqueAuthors.size
    };
  }, [papers]);

  // 핸들러: 삭제
  const handleDelete = async (paperId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    if (!window.confirm('정말로 이 논문을 삭제하시겠습니까?')) return;

    try {
      await ApiService.deletePaper(paperId);
      // 목록 갱신
      setPapers(prev => prev.filter(p => p.id !== paperId));
    } catch (err) {
      alert('삭제에 실패했습니다.');
    }
  };

  // 핸들러: 수정 모달 열기
  const handleEditClick = (paper: LibraryPaper, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPaper(paper);
  };

  // 핸들러: 수정 완료 후 처리
  const handleUpdateSuccess = () => {
    // 전체 목록을 다시 불러오거나, 로컬 상태만 업데이트
    fetchPapers(); 
    setEditingPaper(null);
  };

  // 핸들러: 업로드 성공
  const handleUploadSuccess = () => {
    fetchPapers();
    setIsUploadMode(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">라이브러리</h1>
            <p className="text-gray-600 mt-1 text-sm">
              {stats.totalPapers}개 논문 • {stats.totalAuthors}명 저자
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {!isUploadMode && (
              <button
                onClick={() => setIsUploadMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm font-medium shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                새 논문 업로드
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                닫기
              </button>
            )}
          </div>
        </div>

        {/* 검색바 (리스트 모드일 때만 표시) */}
        {!isUploadMode && (
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="논문 제목, 저자로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center">
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            {error}
          </div>
        )}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="px-6 py-6">
        {isUploadMode ? (
          /* 업로드 폼 뷰 */
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-6">새 논문 업로드</h2>
            <PaperUploadForm 
              onSuccess={handleUploadSuccess}
              onCancel={() => setIsUploadMode(false)}
            />
          </div>
        ) : (
          /* 리스트 뷰 */
          <>
            {isLoading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">라이브러리를 불러오는 중입니다...</p>
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {searchQuery ? '검색 결과가 없습니다' : '라이브러리가 비어있습니다'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery 
                    ? '다른 검색어로 시도해보세요'
                    : '연구에 필요한 논문을 업로드하여 관리해보세요.'
                  }
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setIsUploadMode(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    첫 논문 업로드하기
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPapers.map((paper) => (
                  <div
                    key={paper.id}
                    className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer flex flex-col"
                    onClick={() => onPaperSelect?.(paper)}
                  >
                    <div className="p-6 flex-1">
                      {/* 논문 제목 */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
                        {paper.title}
                      </h3>

                      {/* 저자 */}
                      <div className="flex items-center text-sm text-gray-600 mb-4">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate">
                          {paper.authors.map(a => a.name).join(', ')}
                        </span>
                      </div>

                      {/* 메타 정보 태그 */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {paper.publicationDate && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            📅 {new Date(paper.publicationDate).getFullYear()}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          📄 PDF/DOCX
                        </span>
                      </div>

                      {/* 초록 미리보기 */}
                      {paper.abstract && (
                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                          {paper.abstract}
                        </p>
                      )}
                    </div>

                    {/* 카드 푸터 (액션 버튼) */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-xs text-gray-400">
                        {new Date(paper.uploadedAt).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-3">
                        <button
                          onClick={(e) => handleEditClick(paper, e)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          수정
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={(e) => handleDelete(paper.id, e)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ==================== 채팅 플로팅 버튼 & 패널 ==================== */}
      
      {/* 1. 플로팅 버튼 (FAB) */}
      <button
        onClick={() => setShowChat(!showChat)}
        className={`fixed bottom-8 right-8 p-4 rounded-full shadow-lg transition-all duration-300 z-40 flex items-center justify-center ${
          showChat 
            ? 'bg-gray-800 text-white rotate-90' 
            : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-110'
        }`}
        title="AI 연구 보조원과 대화하기"
      >
        {showChat ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* 2. 채팅 패널 (팝오버 형태) */}
      <div 
        className={`fixed bottom-24 right-8 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 overflow-hidden transition-all duration-300 origin-bottom-right ${
          showChat 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <h3 className="font-semibold flex items-center">
              <span className="mr-2 text-xl">🤖</span> 
              Research Assistant
            </h3>
            <span className="text-xs bg-blue-500 px-2 py-1 rounded-full">Beta</span>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ChatPanel 
              placeholder="내 라이브러리의 논문들에 대해 질문해보세요..." 
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* 수정 모달 */}
      <PaperEditModal
        isOpen={!!editingPaper}
        paper={editingPaper}
        onClose={() => setEditingPaper(null)}
        onUpdateSuccess={handleUpdateSuccess}
      />
    </div>
  );
};

export default LibraryPage;