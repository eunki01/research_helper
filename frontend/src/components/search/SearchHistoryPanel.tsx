import React, { useState } from 'react';
import type { VisualizationView } from '../../types/visualization';
import type { SearchFilters } from '../../types/search';
import { DEFAULT_FILTERS } from '../../types/search';
import SearchFilterPanel from './SearchFilterPanel';

interface SearchHistoryPanelProps {
  views: VisualizationView[];
  currentViewIndex: number;
  onNavigate: (index: number) => void;
  onSearch: (query: string, filters?: SearchFilters) => void;
  className?: string;
}

const SearchHistoryPanel: React.FC<SearchHistoryPanelProps> = ({
  views,
  currentViewIndex,
  onNavigate,
  onSearch,
  className = ''
}) => {
  const currentView = views[currentViewIndex];
  const [inputQuery, setInputQuery] = useState('');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  // 활성화된 필터 개수 계산
  const activeFilterCount = [
    filters.startYear, filters.endYear, filters.isOpenAccess,
    filters.venues, ...filters.publicationTypes, ...filters.fieldsOfStudy
  ].filter(Boolean).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim()) {
      onSearch(inputQuery, filters);
      setInputQuery(''); // 입력창 초기화
      setIsFilterOpen(false); // 필터 닫기
    }
  };

  // 필터 내용을 배지로 렌더링하는 헬퍼 함수
  const renderFilterBadges = (filters?: SearchFilters) => {
    if (!filters) return null;
    const badges = [];

    // 연도 필터
    if (filters.startYear || filters.endYear) {
      const yearText = filters.startYear && filters.endYear
        ? `${filters.startYear}-${filters.endYear}`
        : filters.startYear
          ? `${filters.startYear} 이후`
          : `${filters.endYear} 이전`;
      badges.push(`📅 ${yearText}`);
    }

    // 오픈 액세스
    if (filters.isOpenAccess) {
      badges.push('🔓 Open Access');
    }

    // 저널/학회 (첫 번째 항목만 표시하고 외 n건 처리)
    if (filters.venues) {
      const venueList = filters.venues.split(',');
      const venueText = venueList.length > 1 
        ? `${venueList[0].trim()} 외 ${venueList.length - 1}건` 
        : venueList[0].trim();
      badges.push(`🏛️ ${venueText}`);
    }

    // 출판 유형
    if (filters.publicationTypes && filters.publicationTypes.length > 0) {
      const typeText = filters.publicationTypes.length > 1
        ? `${filters.publicationTypes[0]} 외 ${filters.publicationTypes.length - 1}건`
        : filters.publicationTypes[0];
      badges.push(`📄 ${typeText}`);
    }

    // 연구 분야
    if (filters.fieldsOfStudy && filters.fieldsOfStudy.length > 0) {
      const fieldText = filters.fieldsOfStudy.length > 1
        ? `${filters.fieldsOfStudy[0]} 외 ${filters.fieldsOfStudy.length - 1}건`
        : filters.fieldsOfStudy[0];
      badges.push(`🎓 ${fieldText}`);
    }

    if (badges.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {badges.map((badge, idx) => (
          <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">
            {badge}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-gray-50 border-r border-gray-200 ${className}`}>
      {/* 헤더 & 검색창 */}
      <div className="p-4 bg-white border-b border-gray-200 flex-shrink-0 space-y-3 z-20"> {/* z-index 추가 */}
        <h2 className="font-bold text-gray-800 flex items-center">
          <span className="text-xl mr-2">🕒</span> 
          검색 기록
        </h2>
        
        {/* 검색창 영역 (relative) */}
        <div className="relative">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
                <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="새로운 논문 검색..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* [추가] 필터 토글 버튼 */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 rounded-lg transition-colors relative flex-shrink-0 ${
                isFilterOpen || activeFilterCount > 0 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title="상세 필터"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {/* 필터 활성 배지 */}
              {activeFilterCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>
          </form>

          {/* [추가] 필터 패널 (absolute position) */}
          {isFilterOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-30">
               <SearchFilterPanel 
                  filters={filters} 
                  onChange={setFilters} 
                  onClose={() => setIsFilterOpen(false)} 
               />
            </div>
          )}
        </div>
      </div>

      {/* 히스토리 리스트 (기존 코드 유지) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* ... (기존 맵핑 로직 및 JSX 유지) ... */}
        {views.length === 0 ? (
          <div className="text-center text-gray-400 py-10 text-sm">
            <p>검색 기록이 없습니다.</p>
            <p className="mt-2 text-xs">외부 논문을 검색하여<br/>지식 그래프를 만들어보세요.</p>
          </div>
        ) : (
          [...views].reverse().map((view, reverseIndex) => {
             const realIndex = views.length - 1 - reverseIndex;
             const isCurrent = realIndex === currentViewIndex;
             return (
               <div
                key={view.id}
                onClick={() => onNavigate(realIndex)}
                className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md relative overflow-hidden ${
                  isCurrent
                    ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                {isCurrent && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                )}
                
                <div className="flex justify-between items-start mb-1 pl-1">
                  <h3 className={`font-semibold text-sm line-clamp-1 ${isCurrent ? 'text-blue-700' : 'text-gray-800'}`} title={view.query}>
                    {view.query}
                  </h3>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {new Date(view.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 mb-1 pl-1">
                  <span className="inline-flex items-center mr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1"></span>
                    논문 {view.graph.nodes.filter(n => n.type === 'paper').length}개
                  </span>
                  <span className="inline-flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-1"></span>
                    관계 {view.graph.edges.length}개
                  </span>
                </p>

                <div className="pl-1">
                  {renderFilterBadges(view.filters)}
                </div>
              </div>
             );
          })
        )}
      </div>
      
      {/* 하단 요약 (기존 코드 유지) */}
      {currentView && (
        <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Current View Info</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="truncate" title={currentView.query}>
              <strong>Query:</strong> {currentView.query}
            </p>
            <p>
              <strong>Mode:</strong> {currentView.graph.searchMode === 'external' ? 'External Search' : 'Library Search'}
            </p>
            <p>
              <strong>Nodes:</strong> {currentView.graph.nodes.length} / <strong>Edges:</strong> {currentView.graph.edges.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchHistoryPanel;