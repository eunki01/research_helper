// src/App.tsx

import React, { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import VisualizationPage from './pages/VisualizationPage';
import LibraryPage from './pages/LibraryPage';
import { LibraryService } from './services/libraryService';
import ApiService from './services/apiService';
import SearchService from './services/searchService';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import type { VisualizationState } from './types/visualization';
import type { SearchMode } from './types/search';
import type { LibraryPaper } from './types/paper';

// App 컴포넌트를 테마 컨텍스트로 감싸기
const AppContent: React.FC = () => {
  const { searchMode, setSearchMode } = useTheme();
  const [currentPage, setCurrentPage] = useState<'home' | 'visualization' | 'library'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [libraryPapers, setLibraryPapers] = useState<LibraryPaper[]>([]);
  const [visualizationState, setVisualizationState] = useState<VisualizationState>({
    currentViewIndex: 0,
    views: [],
    maxViews: 20
  });

  // 라이브러리 데이터 로드
  useEffect(() => {
    setLibraryPapers(LibraryService.getLibraryPapers());
  }, []);

  // 검색 실행
  const handleSearch = async (query: string, mode: SearchMode, selectedSeedPaper?: string) => {
    setIsLoading(true);
    
    try {
      let response;
      
      // [수정] 1. 파일 기반 검색 (selectedSeedPaper 존재 시)
      if (selectedSeedPaper) {
         // 파일 검색은 내부 RAG 엔진을 사용하므로 searchSimilarity 호출
         response = await ApiService.searchSimilarity(selectedSeedPaper, 5);
         
         // 시각화 뷰 생성 (Internal 뷰 포맷 사용)
         const view = SearchService.transformInternalToVisualizationView(
            response, 
            `File: ${query}`, // 쿼리에는 파일 제목이 들어옴
            'internal', 
            selectedSeedPaper
         );
         
         setVisualizationState({ currentViewIndex: 0, views: [view], maxViews: 20 });
         setCurrentPage('visualization');
         return; 
      }

      // [기존] 2. 텍스트 기반 검색
      if (mode === 'external') {
        response = await ApiService.searchExternal(query, 5);
        const view = SearchService.transformExternalToVisualizationView(
          response, query, mode, undefined
        );
        setVisualizationState({ currentViewIndex: 0, views: [view], maxViews: 20 });
      } else {
        response = await ApiService.searchInternal(query, 5, 0.7);
        const view = SearchService.transformInternalToVisualizationView(
          response, query, mode, undefined
        );
        setVisualizationState({ currentViewIndex: 0, views: [view], maxViews: 20 });
      }
      
      setCurrentPage('visualization');
    } catch (error) {
      console.error('Search failed:', error);
      alert(`검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 노드 클릭 처리 (실제 확장은 이 함수가 담당, VisualizationPage에서 호출됨)
  const handleNodeClick = async (nodeId: string) => {
    setIsLoading(true);
    
    try {
      const currentView = visualizationState.views[visualizationState.currentViewIndex];
      const clickedNode = currentView.graph.nodes.find((node: any) => node.id === nodeId);
      
      if (!clickedNode) {
        console.error('Clicked node not found:', nodeId);
        return;
      }
      
      const query = clickedNode.data.title;
      const mode = currentView.graph.searchMode || 'external';
      
      let response;
      if (mode === 'external') {
        response = await ApiService.searchExternal(query, 5);
        const newView = SearchService.transformExternalToVisualizationView(
          response, query, mode, nodeId, currentView.breadcrumbPath
        );
        
        const newViews = [...visualizationState.views];
        const insertIndex = visualizationState.currentViewIndex + 1;
        if (newViews.length >= visualizationState.maxViews) newViews.shift();
        newViews.splice(insertIndex, 0, newView);
        
        setVisualizationState({ ...visualizationState, views: newViews, currentViewIndex: insertIndex });
      } else {
        response = await ApiService.searchInternal(query, 5, 0.7);
        const newView = SearchService.transformInternalToVisualizationView(
          response, query, mode, nodeId, currentView.breadcrumbPath
        );
        
        const newViews = [...visualizationState.views];
        const insertIndex = visualizationState.currentViewIndex + 1;
        if (newViews.length >= visualizationState.maxViews) newViews.shift();
        newViews.splice(insertIndex, 0, newView);
        
        setVisualizationState({ ...visualizationState, views: newViews, currentViewIndex: insertIndex });
      }
      
    } catch (error) {
      console.error('Node expansion failed:', error);
      alert(`노드 확장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBreadcrumbNavigation = (breadcrumbIndex: number) => {
    const viewIndex = breadcrumbIndex - 1;
    if (viewIndex < 0) {
      setCurrentPage('home');
      setVisualizationState({ currentViewIndex: 0, views: [], maxViews: 20 });
      return;
    }
    setVisualizationState(prev => ({
      ...prev,
      currentViewIndex: viewIndex,
      views: prev.views.slice(0, viewIndex + 1)
    }));
  };

  const handleCarouselNavigation = (viewIndex: number) => {
    setVisualizationState(prev => ({ ...prev, currentViewIndex: viewIndex }));
  };

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
  };

  const handleOpenLibrary = () => {
    setCurrentPage('library');
  };

  const renderCurrentPage = () => {
    if (currentPage === 'home') {
      return (
        <HomePage
          onSearch={handleSearch}
          libraryPapers={libraryPapers}
          isLoading={isLoading}
          currentMode={searchMode}
          onModeChange={handleModeChange}
        />
      );
    }
    
    if (currentPage === 'library') {
      return (
        <LibraryPage
          onPaperSelect={() => setCurrentPage('home')}
          onClose={() => setCurrentPage('home')}
        />
      );
    }
    
    return (
      <VisualizationPage
        views={visualizationState.views}
        currentViewIndex={visualizationState.currentViewIndex}
        onNodeClick={handleNodeClick}
        onNavigateToView={handleCarouselNavigation}
      />
    );
  };

  return (
    <MainLayout
      visualizationState={visualizationState}
      onNavigateToView={handleBreadcrumbNavigation}
      onOpenLibrary={handleOpenLibrary}
      // [수정] 시각화 페이지에서는 MainLayout의 사이드바를 숨김 (자체 3단 레이아웃 사용)
      showSidebar={false} 
    >
      {renderCurrentPage()}
    </MainLayout>
  );
};

function App() {
  return (
    <ThemeProvider initialMode="external">
      <AppContent />
    </ThemeProvider>
  );
}

export default App;