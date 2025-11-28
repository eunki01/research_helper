import React, { useState } from 'react';
import type { LibraryPaper } from '../../types/paper';
import type { SearchFilters, SearchMode } from '../../types/search';
import { DEFAULT_FILTERS } from '../../types/search';
import LibraryModal from '../library/LibraryModal';
import SearchFilterPanel from './SearchFilterPanel';

interface SearchBarProps {
  onSearch: (query: string, mode: SearchMode, selectedSeedPaper?: string, filters?: SearchFilters) => void;
  libraryPapers: LibraryPaper[];
  isLoading: boolean;
  currentMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading,
  currentMode,
  onModeChange
}) => {
  const [query, setQuery] = useState('');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [searchFile, setSearchFile] = useState<LibraryPaper | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  const activeFilterCount = [
    filters.startYear, filters.endYear, filters.isOpenAccess,
    filters.venues, ...filters.publicationTypes, ...filters.fieldsOfStudy
  ].filter(Boolean).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (searchFile) {
      // 파일이 선택된 경우: 파일 제목과 ID를 전달
      // App.tsx에서 selectedSeedPaper(ID)가 있으면 텍스트 쿼리 대신 파일 기반 검색을 수행하도록 처리됨
      onSearch(searchFile.title, currentMode, searchFile.id);
    } else if (query.trim()) {
      // 텍스트 검색 시 필터 전달
      onSearch(query, currentMode, undefined, filters);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        {/* 검색 모드 토글 */}
        <div className="absolute left-3 z-10">
          <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
            <button
              type="button"
              onClick={() => onModeChange('internal')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                currentMode === 'internal' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              내부 검색
            </button>
            <button
              type="button"
              onClick={() => onModeChange('external')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                currentMode === 'external' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              외부 검색
            </button>
          </div>
        </div>

        {/* 파일 선택 시 표시되는 Chip */}
        {searchFile ? (
          <div className="absolute left-48 flex items-center bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg z-10 animate-fade-in">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium truncate max-w-[200px]">{searchFile.title}</span>
            <button 
              type="button" 
              onClick={() => setSearchFile(null)}
              className="ml-2 p-0.5 hover:bg-blue-200 rounded-full text-blue-600"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : null}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchFile ? "" : (currentMode === 'internal' ? "내 라이브러리에서 검색..." : "외부 논문 검색...")}
          disabled={isLoading || !!searchFile}
          className={`w-full h-14 pl-48 pr-32 rounded-2xl border-2 transition-all duration-200 outline-none shadow-sm
            ${isLoading ? 'bg-gray-50' : 'bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100'}
            ${!!searchFile ? 'text-transparent cursor-default' : 'text-gray-900'} 
          `}
        />

        {/* 우측 버튼 그룹 */}
        <div className="absolute right-3 flex items-center space-x-2">
          {/*  필터 버튼 (외부 검색일 때만 표시) */}
          {!searchFile && currentMode === 'external' && (
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2.5 rounded-xl transition-colors relative ${
                isFilterOpen || activeFilterCount > 0 
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title="상세 필터"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {/* 필터 활성 배지 */}
              {activeFilterCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          )}

          {/* 파일 첨부(클립) 버튼 */}
          {!searchFile && currentMode !== 'external' && (
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              title="파일로 검색 (라이브러리)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || (!query.trim() && !searchFile)}
            className={`px-6 py-2.5 rounded-xl font-medium text-white transition-all shadow-md flex items-center
              ${isLoading || (!query.trim() && !searchFile)
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'}`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>검색</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 필터 패널 렌더링 */}
      {isFilterOpen && currentMode === 'external' && (
        <SearchFilterPanel 
          filters={filters} 
          onChange={setFilters} 
          onClose={() => setIsFilterOpen(false)} 
        />
      )}

      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectPaper={(paper) => {
          setSearchFile(paper);
          // 모달은 여기서 닫지 않고 사용자가 명시적으로 닫거나, 선택 후 자동 닫힘 처리됨
        }}
      />
    </div>
  );
};

export default SearchBar;