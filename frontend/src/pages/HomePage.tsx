import React from 'react';
import SearchBar from '../components/search/SearchBar';
import type { SearchMode } from '../types/search';
import type { LibraryPaper } from '../types/paper';

interface HomePageProps {
  onSearch: (query: string, mode: SearchMode, selectedSeedPaper?: string) => void;
  libraryPapers: LibraryPaper[];
  isLoading?: boolean;
  currentMode?: SearchMode;
  onModeChange?: (mode: SearchMode) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  onSearch,
  libraryPapers,
  isLoading = false,
  currentMode = 'external',
  onModeChange
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      {/* 메인 타이틀 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Research Navigator
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          학술 논문의 관계를 탐색하고 연구를 발전시키세요
        </p>
        <p className="text-gray-500">
          AI 기반 논문 검색 및 시각화 플랫폼
        </p>
      </div>

      {/* 검색바 */}
      <SearchBar
        onSearch={onSearch}
        libraryPapers={libraryPapers}
        isLoading={isLoading}
        currentMode={currentMode}
        onModeChange={onModeChange}
      />

      {/* 사용법 안내 */}
      <div className="mt-16 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
          사용법
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                currentMode === 'external' ? 'bg-green-500' : 'bg-blue-500'
              }`}>
                1
              </div>
              <h3 className="ml-3 font-medium text-gray-900">검색 모드 선택</h3>
            </div>
            <p className="text-gray-600 text-sm">
              외부 검색은 Semantic Scholar에서 논문을 찾고, 
              내부 검색은 업로드한 논문에서 검색합니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm font-bold">
                2
              </div>
              <h3 className="ml-3 font-medium text-gray-900">Seed 논문 선택</h3>
            </div>
            <p className="text-gray-600 text-sm">
              클립 아이콘을 클릭하여 라이브러리에서 
              기준이 될 논문을 선택할 수 있습니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm font-bold">
                3
              </div>
              <h3 className="ml-3 font-medium text-gray-900">질문 입력</h3>
            </div>
            <p className="text-gray-600 text-sm">
              궁금한 연구 주제나 질문을 입력하고 
              검색 버튼을 클릭하세요.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm font-bold">
                4
              </div>
              <h3 className="ml-3 font-medium text-gray-900">탐색 시작</h3>
            </div>
            <p className="text-gray-600 text-sm">
              시각화된 그래프에서 노드를 클릭하여 
              관련 논문들을 무한히 탐색하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
