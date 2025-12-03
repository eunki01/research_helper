import React from 'react';
import type { LibraryPaper } from '../../types/paper';

interface PaperDetailModalProps {
  isOpen: boolean;
  paper: LibraryPaper | null;
  onClose: () => void;
}

const PaperDetailModal: React.FC<PaperDetailModalProps> = ({ 
  isOpen, 
  paper, 
  onClose 
}) => {
  if (!isOpen || !paper) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 백드롭 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between z-10">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {paper.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 바디 - 스크롤 가능 */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-6">
            
            {/* 저자 정보 */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                저자
              </h3>
              <div className="flex flex-wrap gap-2">
                {paper.authors.map((author, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700"
                  >
                    {author}
                  </span>
                ))}
              </div>
            </div>

            {/* 메타데이터 */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              {paper.publicationDate && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">출판 날짜</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(paper.publicationDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              
              {paper.venue && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">발표 장소</p>
                  <p className="text-sm font-medium text-gray-900">{paper.venue}</p>
                </div>
              )}

              {paper.citationCount !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">인용 수</p>
                  <p className="text-sm font-medium text-gray-900">
                    {paper.citationCount.toLocaleString()}회
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 mb-1">업로드 날짜</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(paper.uploadedAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>

            {/* TLDR (요약) */}
            {paper.tldr && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  한 줄 요약
                </h3>
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="text-sm text-gray-800 leading-relaxed">{paper.tldr}</p>
                </div>
              </div>
            )}

            {/* 초록 */}
            {paper.abstract && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  초록
                </h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {paper.abstract}
                  </p>
                </div>
              </div>
            )}

            {/* PDF 링크 */}
            {paper.openAccessPdf && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  원문
                </h3>
                <a
                  href={paper.openAccessPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  PDF 열기
                </a>
              </div>
            )}

            {/* ID 정보 (디버깅용) */}
            <div className="pt-4 border-t border-gray-200">
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">기술 정보</summary>
                <div className="mt-2 p-2 bg-gray-50 rounded font-mono">
                  <p>ID: {paper.id}</p>
                  <p>Type: {paper.type}</p>
                </div>
              </details>
            </div>
          </div>

          {/* 푸터 */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperDetailModal;