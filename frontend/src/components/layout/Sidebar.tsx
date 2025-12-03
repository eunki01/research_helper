import React from 'react';
import type { LibraryPaper } from '../../types/paper';

interface SidebarProps {
  selectedPaper?: LibraryPaper; // 현재 정보를 보여주는 논문 (단일 클릭)
  searchSeedPaper?: LibraryPaper | null; // 검색 시드로 지정된 논문 (우클릭)
  onExplorePaper?: () => void; // 검색 실행 함수
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedPaper,
  searchSeedPaper,
  onExplorePaper
}) => {
  return (
    <aside className="w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-lg z-20">
      {/* ==================== 상단: 탐색 도구 (항상 표시) ==================== */}
      <div className="p-6 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">연구 탐색</h2>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">관련 논문 검색</h3>
          
          {searchSeedPaper ? (
            <>
              <div className="mb-3 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100 break-words">
                <span className="font-bold">Target:</span> {searchSeedPaper.title}
              </div>
              <button
                onClick={onExplorePaper}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>검색 실행</span>
              </button>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-gray-500 mb-2">
                그래프의 노드를 <span className="font-bold text-gray-700">우클릭</span>하여<br/>
                검색 시드로 지정하세요.
              </p>
              <button
                disabled
                className="w-full bg-gray-200 text-gray-400 font-semibold py-2.5 px-4 rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>시드 미선택</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================== 하단: 상세 정보 (스크롤 가능) ==================== */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">상세 정보</h2>
        </div>

        {selectedPaper ? (
          <div className="space-y-6 animate-fade-in">
            {/* 제목 */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Title</h3>
              <p className="text-gray-900 font-medium leading-relaxed">{selectedPaper.title}</p>
            </div>

            {/* 저자 */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Authors</h3>
              <div className="space-y-1">
                {selectedPaper.authors.map((author, idx) => (
                    <div key={idx} className="text-sm text-gray-800">
                        • <span className="font-medium">{author}</span>
                    </div>
                ))}
            </div>
            </div>

            {/* 메타 정보 */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Date</h3>
                <p className="text-sm text-gray-900">{selectedPaper.publicationDate || '-'}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Citations</h3>
                <p className="text-sm text-gray-900">{selectedPaper.citationCount ? `${selectedPaper.citationCount}회` : '-'}</p>
              </div>
            </div>

            {/* 저널/학회 */}
            {selectedPaper.venue && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Venue</h3>
                <p className="text-sm text-gray-900">{selectedPaper.venue}</p>
              </div>
            )}

            {/* 초록 */}
            {selectedPaper.abstract && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Abstract</h3>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {selectedPaper.abstract}
                </p>
              </div>
            )}

            {/* TL;DR */}
            {selectedPaper.tldr && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">TL;DR</h3>
                <p className="text-sm text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  {selectedPaper.tldr}
                </p>
              </div>
            )}

            {/* 연구 분야 */}
            {selectedPaper.fieldsOfStudy && selectedPaper.fieldsOfStudy.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Fields</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPaper.fieldsOfStudy.map((field) => (
                    <span key={field} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 선택된 논문 없을 때 Placeholder */
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center p-4">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">
              그래프에서 노드를 <span className="font-bold text-gray-500">좌클릭</span>하면<br/>
              상세 정보가 여기에 표시됩니다.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;