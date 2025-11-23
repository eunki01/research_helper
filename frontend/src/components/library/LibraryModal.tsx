import React, { useState, useEffect } from 'react';
import ApiService from '../../services/apiService';
import type { LibraryPaper } from '../../types/paper';
import PaperUploadForm from './PaperUploadForm';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaper: (paper: LibraryPaper) => void;
  selectedPaperId?: string;
}


const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectPaper,
  selectedPaperId
}) => {
  const [papers, setPapers] = useState<LibraryPaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadMode, setIsUploadMode] = useState(false);

  // 백엔드에서 문서 목록 불러오기
  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await ApiService.getDocuments();
      
      // 백엔드 응답을 LibraryPaper 형식으로 변환
      const libraryPapers: LibraryPaper[] = docs.map((doc: any, index: number) => ({
        id: doc.doi || `doc-${index}`,
        title: doc.title,
        authors: [{ name: doc.authors || 'Unknown' }],
        type: 'paper',
        publicationDate: doc.published,
        abstract: doc.content,
        uploadedAt: doc.published, // 또는 현재 시간
        isSeed: false
      }));

      setPapers(libraryPapers);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 모달이 열릴 때마다 라이브러리 데이터 로드
  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
      setSearchQuery('');
      setIsUploadMode(false);
    }
  }, [isOpen]);

  // 검색 필터링
  const filteredPapers = papers.filter(paper => 
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.authors.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 파일 업로드 처리
  const handleFileUpload = () => {
    fetchDocuments().then(() => {
       setIsUploadMode(false);
    });
  };

  // 논문 선택
  const handlePaperSelect = (paper: LibraryPaper) => {
    onSelectPaper(paper);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isUploadMode ? '새 논문 업로드' : '라이브러리에서 논문 선택'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 리스트 뷰일 때만 검색바와 업로드 버튼 표시 */}
          {!isUploadMode && (
            <div className="flex gap-3">
              <div className="relative flex-1">
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
              <button
                onClick={() => setIsUploadMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center whitespace-nowrap shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                새 논문 업로드
              </button>
            </div>
          )}
        </div>

        {/* 컨텐츠 영역 (스크롤 가능) */}
        <div className="p-6 overflow-y-auto flex-1">
          {isUploadMode ? (
            /* 업로드 폼 뷰 */
            <PaperUploadForm 
              onSuccess={handleFileUpload}
              onCancel={() => setIsUploadMode(false)}
            />
          ) : (
            /* 리스트 뷰 */
            <>
              { isLoading ? (
                <div className="text-center py-12">
                  <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-500">문서 목록을 불러오는 중...</p>
                </div>
              ) : filteredPapers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    {searchQuery ? '검색 결과가 없습니다' : '라이브러리가 비어있습니다'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {searchQuery 
                      ? '다른 검색어로 시도해보세요.' 
                      : '새로운 논문을 업로드하여 분석을 시작해보세요.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPapers.map((paper) => (
                    <button
                      key={paper.id}
                      onClick={() => handlePaperSelect(paper)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
                        selectedPaperId === paper.id
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 mr-4">
                          <h3 className={`font-semibold text-lg mb-1 truncate ${
                            selectedPaperId === paper.id ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-600'
                          }`}>
                            {paper.title}
                          </h3>
                          <div className="flex flex-wrap items-center text-sm text-gray-500 gap-y-1">
                            <span className="flex items-center mr-3">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {paper.authors[0]?.name || 'Unknown Author'}
                              {paper.authors.length > 1 && ` 외 ${paper.authors.length - 1}명`}
                            </span>
                            {paper.publicationDate && (
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {new Date(paper.publicationDate).getFullYear()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* 선택 상태 표시 아이콘 */}
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedPaperId === paper.id
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 text-transparent group-hover:border-blue-400'
                        }`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 푸터: 선택된 항목이 있고, 리스트 뷰일 때만 표시 */}
        {!isUploadMode && selectedPaperId && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2 font-medium text-gray-900">선택됨:</span>
                <span className="truncate max-w-xs sm:max-w-md">
                  {papers.find(p => p.id === selectedPaperId)?.title}
                </span>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                선택 완료
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryModal;


