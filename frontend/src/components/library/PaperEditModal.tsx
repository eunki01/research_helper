import React, { useState, useEffect } from 'react';
import ApiService from '../../services/apiService';
import type { LibraryPaper } from '../../types/paper';

interface PaperEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: LibraryPaper | null;
  onUpdateSuccess: (updatedPaper: { id: string; title: string }) => void;
}

const PaperEditModal: React.FC<PaperEditModalProps> = ({
  isOpen,
  onClose,
  paper,
  onUpdateSuccess
}) => {
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [venue, setVenue] = useState('');
  const [citationCount, setCitationCount] = useState('');
  const [tldr, setTldr] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달이 열리거나 선택된 논문이 바뀔 때 폼 초기화
  useEffect(() => {
    if (isOpen && paper) {
      setTitle(paper.title || '');
      
      // Author[] -> "Name1, Name2" 문자열 변환
      const authorsStr = paper.authors
        .map(a => a.name)
        .filter(name => name && name !== 'Unknown')
        .join(', ');
      setAuthors(authorsStr);

      // 날짜에서 연도 추출 (예: "2023-10-01" -> "2023")
      if (paper.publicationDate) {
        const y = new Date(paper.publicationDate).getFullYear();
        setYear(isNaN(y) ? '' : y.toString());
      } else {
        setYear('');
      }
      
      setVenue(paper.venue || '');
      setCitationCount(paper.citationCount !== undefined ? paper.citationCount.toString() : '');
      setTldr(paper.tldr || '');

      setError(null);
    }
  }, [isOpen, paper]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paper) return;
    if (!title.trim()) {
      setError('논문 제목은 필수입니다.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await ApiService.updatePaper(paper.id, {
        title: title.trim(),
        authors: authors.trim(),
        year: year ? parseInt(year) : undefined,
        venue: venue || undefined,
        citationCount: citationCount ? parseInt(citationCount) : undefined,
        tldr: tldr || undefined
      });

      onUpdateSuccess({ 
        id: paper.id, 
        title: title.trim() 
      });
      onClose();
    } catch (err) {
      console.error('Update failed:', err);
      setError(err instanceof Error ? err.message : '수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !paper) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden transform transition-all">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">논문 정보 수정</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="논문 제목"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              저자 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 홍길동, Kim..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              발행 연도
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 2024"
              min="1900"
              max={new Date().getFullYear() + 1}
            />
          </div>

          {/* [추가] 상세 정보 입력 섹션 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">저널/학회</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">인용 횟수</label>
              <input
                type="number"
                value={citationCount}
                onChange={(e) => setCitationCount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">요약 (TL;DR)</label>
            <textarea
              value={tldr}
              onChange={(e) => setTldr(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors font-medium"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className={`px-4 py-2 rounded-md text-white font-medium transition-colors shadow-sm ${
                isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaperEditModal;