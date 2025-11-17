import React, { useState, useEffect } from 'react';
import { LibraryService } from '../../services/libraryService';
import type { LibraryPaper } from '../../types/paper';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // 모달이 열릴 때마다 라이브러리 데이터 로드
  useEffect(() => {
    if (isOpen) {
      setPapers(LibraryService.getLibraryPapers());
      setSearchQuery('');
    }
  }, [isOpen]);

  // 검색 필터링
  const filteredPapers = searchQuery 
    ? LibraryService.searchPapers(searchQuery)
    : papers;

  // 파일 업로드 처리
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Mock 파일 업로드 - 실제 API 연동 시 교체 예정
      const mockPaper: Omit<LibraryPaper, 'id' | 'uploaded_at'> = {
        title: file.name.replace(/\.[^/.]+$/, ''),
        authors: [{ name: 'Unknown Author' }],
        type: 'paper',
        publicationDate: new Date().toISOString().split('T')[0],
        venue: 'Uploaded Document',
        abstract: 'This is an uploaded document. Abstract will be extracted automatically.',
        fieldsOfStudy: ['Computer Science'],
        filePath: file.name,
        isSeed: false,
        uploadedAt: "now"
      };

      const newPaper = LibraryService.addPaper(mockPaper);
      setPapers(LibraryService.getLibraryPapers());
      
      // 새로 업로드된 논문을 자동 선택
      onSelectPaper(newPaper);
      
      // 파일 입력 초기화
      event.target.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // 논문 선택
  const handlePaperSelect = (paper: LibraryPaper) => {
    onSelectPaper(paper);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">라이브러리에서 논문 선택</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 검색바 */}
          <div className="mt-4">
            <div className="relative">
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
          </div>

          {/* 업로드 버튼 */}
          <div className="mt-3">
            <button
              onClick={() => document.getElementById('modal-file-upload')?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isUploading ? '업로드 중...' : '새 논문 업로드'}
            </button>
            <input
              id="modal-file-upload"
              type="file"
              accept=".pdf,.txt,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* 논문 목록 */}
        <div className="p-6 overflow-y-auto max-h-96">
          {filteredPapers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mb-2">
                {searchQuery ? '검색 결과가 없습니다' : '업로드된 논문이 없습니다'}
              </p>
              {!searchQuery && (
                <p className="text-sm">첫 번째 논문을 업로드해보세요</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPapers.map((paper) => (
                <button
                  key={paper.id}
                  onClick={() => handlePaperSelect(paper)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedPaperId === paper.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {paper.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {paper.authors.map(author => author.name).join(', ')}
                      </p>
                      {paper.publication_date && (
                        <p className="text-xs text-gray-500">
                          {paper.publication_date}
                        </p>
                      )}
                    </div>
                    {selectedPaperId === paper.id && (
                      <div className="ml-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        {selectedPaperId && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                선택된 논문: {papers.find(p => p.id === selectedPaperId)?.title}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryModal;


