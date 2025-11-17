import React, { useState } from 'react';
import type { SearchMode } from '../../types/search';
import type { LibraryPaper } from '../../types/paper';
import LibraryModal from '../library/LibraryModal';
import { useTheme } from '../../context/ThemeContext';

interface SearchBarProps {
  onSearch: (query: string, mode: SearchMode, selectedSeedPaper?: string) => void;
  libraryPapers: LibraryPaper[];
  isLoading?: boolean;
  currentMode?: SearchMode;
  onModeChange?: (mode: SearchMode) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  libraryPapers,
  isLoading = false,
  currentMode = 'external',
  onModeChange
}) => {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedSeedPaper, setSelectedSeedPaper] = useState<string | undefined>();
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), currentMode, selectedSeedPaper);
    }
  };

  const handleModeChange = (mode: SearchMode) => {
    onModeChange?.(mode);
  };

  const selectedPaper = libraryPapers.find(paper => paper.id === selectedSeedPaper);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 검색 모드 선택 */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleModeChange('external')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              currentMode === 'external'
                ? 'bg-white text-gray-900 shadow-sm border-2'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{
              borderColor: currentMode === 'external' ? theme.border : 'transparent'
            }}
          >
            외부 검색
          </button>
          <button
            onClick={() => handleModeChange('internal')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              currentMode === 'internal'
                ? 'bg-white text-gray-900 shadow-sm border-2'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{
              borderColor: currentMode === 'internal' ? theme.border : 'transparent'
            }}
          >
            내부 검색
          </button>
        </div>
      </div>

      {/* 검색바 */}
      <form onSubmit={handleSubmit} className="relative">
        <div 
          className="flex items-center bg-white rounded-lg shadow-lg border-2 transition-colors focus-within:shadow-xl"
          style={{ 
            borderColor: theme.accent,
            '--focus-border-color': theme.border
          } as React.CSSProperties & { '--focus-border-color': string }}
        >
          {/* Seed 논문 첨부 버튼 */}
          <button
            type="button"
            onClick={() => setShowLibraryModal(true)}
            className="p-3 border-r transition-colors"
            style={{
              borderRightColor: selectedSeedPaper ? theme.accent : '#E5E7EB',
              color: selectedSeedPaper ? theme.primary : '#9CA3AF'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* 검색 입력 */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="논문이나 연구 주제를 검색해보세요..."
            className="flex-1 px-4 py-4 text-lg placeholder-gray-500 focus:outline-none"
            disabled={isLoading}
          />

          {/* 검색 버튼 */}
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="p-4 transition-colors"
            style={{
              color: isLoading || !query.trim() ? '#9CA3AF' : theme.primary,
              cursor: isLoading || !query.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </div>

        {/* 선택된 Seed 논문 표시 */}
        {selectedSeedPaper && selectedPaper && (
          <div className="mt-4 flex items-center justify-center">
            <div 
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm shadow-md border-2"
              style={{
                backgroundColor: theme.accent,
                color: theme.text,
                borderColor: theme.border
              }}
            >
              <span className="mr-2 text-lg">📄</span>
              <span className="font-semibold">Seed 논문: {selectedPaper.title}</span>
              <button
                onClick={() => setSelectedSeedPaper(undefined)}
                className="ml-3 text-gray-600 hover:text-gray-800 transition-colors"
                title="시드 논문 제거"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </form>

      {/* 라이브러리 모달 */}
      <LibraryModal
        isOpen={showLibraryModal}
        selectedPaperId={selectedSeedPaper}
        onSelectPaper={(paper) => {
          setSelectedSeedPaper(paper.id);
          setShowLibraryModal(false);
        }}
        onClose={() => setShowLibraryModal(false)}
      />
    </div>
  );
};


export default SearchBar;
