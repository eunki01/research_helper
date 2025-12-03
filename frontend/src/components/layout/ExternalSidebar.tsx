import React, { useState } from 'react';
import type { LibraryPaper } from '../../types/paper';
import ApiService from '../../services/apiService';

interface ExternalSidebarProps {
  selectedPaper?: LibraryPaper; // 선택된 논문 정보
  onExpandCitations: (paperId: string) => void; // 인용 논문 확장 핸들러
  onExpandReferences: (paperId: string) => void; // 참고 문헌 확장 핸들러
  isLoading?: boolean; // 로딩 상태
}

const ExternalSidebar: React.FC<ExternalSidebarProps> = ({
  selectedPaper,
  onExpandCitations,
  onExpandReferences,
  isLoading = false
}) => {
  const [isSaving, setIsSaving] = useState(false); // 저장 로딩 상태

  const isSaveable = selectedPaper && !!selectedPaper.abstract;

  // 저장 핸들러
  const handleSaveToLibrary = async () => {
    if (!selectedPaper || !isSaveable) return;
    
    setIsSaving(true);
    try {
      await ApiService.savePaperToLibrary(selectedPaper);
      alert("라이브러리에 성공적으로 저장되었습니다!");
    } catch (error) {
      console.error("Save failed:", error);
      alert(`저장에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedPaper) {
    return (
      <aside className="w-96 bg-gray-50 border-l border-gray-200 p-8 overflow-y-auto flex-shrink-0 flex flex-col items-center justify-center text-gray-400 text-center">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p>그래프에서 논문을 선택하여<br/>인용 관계를 탐색하세요.</p>
      </aside>
    );
  }

  return (
    <aside className="w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-lg z-20">
      {/* 상단: 네트워크 확장 도구 */}
      <div className="p-6 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">네트워크 탐색</h2>
        </div>

        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-800 mb-1 line-clamp-1" title={selectedPaper.title}>
            {selectedPaper.title}
          </h3>
          <p className="text-xs text-blue-600 mb-3">이 논문을 기준으로 그래프 확장</p>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onExpandReferences(selectedPaper.id)}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="text-xs text-gray-500 mb-1 group-hover:text-blue-600">References</span>
              <div className="flex items-center font-bold text-gray-700 group-hover:text-blue-700">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                참고 문헌
              </div>
            </button>

            <button
              onClick={() => onExpandCitations(selectedPaper.id)}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="text-xs text-gray-500 mb-1 group-hover:text-blue-600">Citations</span>
              <div className="flex items-center font-bold text-gray-700 group-hover:text-blue-700">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11" />
                </svg>
                인용 논문
              </div>
            </button>
          </div>

          {/* 라이브러리 저장 버튼 */}
          <button
            onClick={handleSaveToLibrary}
            disabled={isSaving || isLoading || !isSaveable}
            title={!isSaveable ? "저장할 초록(Abstract)이 없습니다." : "라이브러리에 저장"}
            className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center font-semibold text-white transition-all shadow-sm mt-4 ${
              isSaving 
                ? 'bg-green-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 active:scale-95'
            }`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                저장 중...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {isSaveable ? "라이브러리에 저장" : "저장 불가 (PDF/초록 없음)"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* 하단: 상세 정보 (기존 Sidebar와 유사하지만 필요한 정보만 표시) */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6 animate-fade-in">
          {/* 제목 */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Title</h3>
            <p className="text-gray-900 font-medium leading-relaxed">{selectedPaper.title}</p>
          </div>

          {/* 저자 */}
          {selectedPaper.authors.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Authors</h3>
              <p className="text-sm text-gray-800">
                {selectedPaper.authors.join(', ')}
              </p>
            </div>
          )}

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

          {/* 초록 */}
          {selectedPaper.abstract && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Abstract</h3>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 max-h-60 overflow-y-auto">
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
        </div>
      </div>
    </aside>
  );
};

export default ExternalSidebar;