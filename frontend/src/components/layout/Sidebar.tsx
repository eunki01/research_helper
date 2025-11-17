import React from 'react';
import type { LibraryPaper } from '../../types/paper';

interface SidebarProps {
  selectedPaper?: LibraryPaper;
  onExplorePaper?: (paperId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedPaper,
  onExplorePaper
}) => {

  if (!selectedPaper) {
    return (
      <aside className="w-96 bg-gray-50 border-l border-gray-200 p-8 overflow-y-auto flex-shrink-0">
        {/* 빈 사이드바 */}
      </aside>
    );
  }

  return (
    <aside className="w-96 bg-white border-l border-gray-200 p-8 overflow-y-auto flex-shrink-0 shadow-lg">
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">논문 정보</h2>
        </div>

        {/* 관련 논문 탐색 버튼 */}
        <div className="mb-6">
          <button
            onClick={() => onExplorePaper?.(selectedPaper.id)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>관련 논문 탐색</span>
          </button>
          <p className="text-sm text-gray-500 mt-2 text-center">
            이 논문과 관련된 다른 논문들을 찾아보세요
          </p>
        </div>

        {/* 논문 정보 */}
        <div className="space-y-6">
          {/* 제목 */}
          <div>
            <h3 className="text-base font-semibold text-gray-600 mb-2">제목</h3>
            <p className="text-lg text-gray-900 font-medium">{selectedPaper.title}</p>
          </div>

          {/* 저자 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">저자</h3>
            <div className="space-y-1">
              {selectedPaper.authors.map((author) => (
                <div key={author.name} className="text-gray-900">
                  <span className="font-medium">{author.name}</span>
                  {author.affiliation && (
                    <span className="text-sm text-gray-600 ml-2">({author.affiliation})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 발행 정보 */}
          {selectedPaper.publicationDate && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">발행일</h3>
              <p className="text-gray-900">{selectedPaper.publicationDate}</p>
            </div>
          )}

          {/* 저널/학회 */}
          {selectedPaper.venue && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">저널/학회</h3>
              <p className="text-gray-900">{selectedPaper.venue}</p>
            </div>
          )}

          {/* 인용 횟수 */}
          {selectedPaper.citationCount && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">인용 횟수</h3>
              <p className="text-gray-900">{selectedPaper.citationCount.toLocaleString()}회</p>
            </div>
          )}

          {/* 초록 */}
          {selectedPaper.abstract && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">초록</h3>
              <p className="text-gray-900 text-sm leading-relaxed">
                {selectedPaper.abstract.length > 200 
                  ? `${selectedPaper.abstract.substring(0, 200)}...` 
                  : selectedPaper.abstract
                }
              </p>
            </div>
          )}

          {/* TL;DR */}
          {selectedPaper.tldr && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">요약</h3>
              <p className="text-gray-900 text-sm bg-gray-50 p-3 rounded-md">
                {selectedPaper.tldr}
              </p>
            </div>
          )}

          {/* 연구 분야 */}
          {selectedPaper.fieldsOfStudy && selectedPaper.fieldsOfStudy.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">연구 분야</h3>
              <div className="flex flex-wrap gap-1">
              {selectedPaper.fieldsOfStudy.map((field) => (
                <span key={field} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {field}
                </span>
              ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
