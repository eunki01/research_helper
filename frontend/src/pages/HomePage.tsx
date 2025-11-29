import React from 'react';
import SearchBar from '../components/search/SearchBar';
import type { SearchMode, SearchFilters } from '../types/search';

interface HomePageProps {
  onSearch: (query: string, mode: SearchMode, selectedSeedPaper?: string, filters?: SearchFilters) => void;
  isLoading: boolean;
  currentMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  onSearch,
  isLoading,
  currentMode,
  onModeChange
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-white px-4 py-12 animate-fade-in">
      
      {/* 1. 헤더 섹션 */}
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 tracking-tight">
          Research Helper
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          AI 기반 논문 탐색과 지식 확장을 한 곳에서 경험하세요.<br/>
          <span className="text-sm text-gray-500">내 서재의 논문과 전 세계의 연구 자료를 연결해 드립니다.</span>
        </p>
      </div>

      {/* 2. 검색 섹션 (탭 + 검색바) */}
      <div className="w-full max-w-3xl mb-16">
        {/* 모드 전환 탭 */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex shadow-inner">
            <button
              onClick={() => onModeChange('external')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentMode === 'external'
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              🌏 외부 논문 검색
            </button>
            <button
              onClick={() => onModeChange('internal')}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentMode === 'internal'
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              📖 내부 라이브러리 검색
            </button>
          </div>
        </div>

        {/* 검색바 */}
        <div className="relative z-10">
          <SearchBar
            // [수정] 함수 시그니처가 일치하므로 직접 전달
            onSearch={onSearch}
            isLoading={isLoading}
            currentMode={currentMode}
            onModeChange={onModeChange}
            // [추가] 커스텀 props
            placeholder={
              currentMode === 'internal'
                ? "내 서재에 저장된 논문 내용을 검색해보세요..."
                : "관심 있는 연구 주제나 키워드를 입력하세요..."
            }
            showModeToggle={false} // HomePage에서는 탭을 사용하므로 내부 토글 숨김
          />
          {/* 모드 설명 */}
          <p className="text-center text-xs text-gray-400 mt-3">
            {currentMode === 'internal' 
              ? 'RAG 기술을 활용하여 저장된 논문의 핵심 내용을 찾아줍니다.' 
              : 'Semantic Scholar의 2억 편 이상의 논문 데이터베이스를 탐색합니다.'}
          </p>
        </div>
      </div>

      {/* 4. 기능 소개 (Onboarding) */}
      <div className="w-full max-w-4xl border-t border-gray-100 pt-12">
        <h3 className="text-center text-sm font-bold text-gray-400 uppercase tracking-wide mb-8">
          주요 기능 살펴보기
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h4 className="font-bold text-gray-800 mb-2">지능형 논문 검색</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              키워드뿐만 아니라 의미 기반 검색으로<br/>
              관련성 높은 연구 자료를 찾아보세요.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <h4 className="font-bold text-gray-800 mb-2">인용 네트워크 시각화</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              논문 간의 인용 관계를 그래프로 확장하며<br/>
              연구의 흐름을 한눈에 파악하세요.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h4 className="font-bold text-gray-800 mb-2">원클릭 라이브러리</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              외부 검색 논문을 초록과 함께 저장하고<br/>
              나만의 지식 베이스를 구축하세요.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HomePage;