// src/App.tsx

import React, { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import VisualizationPage from './pages/VisualizationPage';
import LibraryPage from './pages/LibraryPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EmailVerificationPage } from './pages/EmailVerificationPage';
import { EmailVerificationPendingPage } from './pages/EmailVerificationPendingPage';
import ApiService from './services/apiService';
import SearchService from './services/searchService';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { VisualizationState } from './types/visualization';
import type { SearchMode, SearchFilters } from './types/search';

// App 컴포넌트를 테마 컨텍스트로 감싸기
const AppContent: React.FC = () => {
  const { searchMode, setSearchMode } = useTheme();
  const { isAuthenticated, currentUser, login, register, logout, verifyEmail, resendVerification, isLoading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'home' | 'visualization' | 'library' | 'login' | 'register' | 'verify-email' | 'verification-pending'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>('');
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [visualizationState, setVisualizationState] = useState<VisualizationState>({
    currentViewIndex: 0,
    views: [],
    maxViews: 20
  });

  // 인증 래퍼 함수 (컴포넌트 레벨로 이동)
  const requireAuth = (callback: Function) => {
    return (...args: any[]) => {
      if (!isAuthenticated) {
        alert('로그인이 필요한 기능입니다.');
        setCurrentPage('login');
        return;
      }
      return callback(...args);
    };
  };

  // 로그인 상태 체크 Effect
  useEffect(() => {
    if (!isAuthenticated && 
        currentPage !== 'login' && 
        currentPage !== 'register' && 
        currentPage !== 'verify-email' && 
        currentPage !== 'verification-pending') {
      setCurrentPage('login');
    }
  }, [isAuthenticated, currentPage]);

  // URL에서 이메일 인증 토큰 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setVerificationToken(token);
      setCurrentPage('verify-email');
    }
  }, []);

  // 로그인 처리
  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    setCurrentPage('home');
  };

  // 회원가입 처리
  const handleRegister = async (email: string, password: string, name: string) => {
    await register(email, password, name);
    // RegisterForm에서 verification-pending 페이지로 이동
  };

  // 이메일 인증 대기 페이지로 이동
  const handleNavigateToVerificationPending = (email: string) => {
    setPendingVerificationEmail(email);
    setCurrentPage('verification-pending');
  };

  // 이메일 인증 처리
  const handleVerifyEmail = async (token: string) => {
    await verifyEmail(token);
  };

  // 인증 이메일 재발송
  const handleResendVerification = async (email: string) => {
    await resendVerification(email);
  };

  // 로그아웃 처리
  const handleLogout = () => {
    logout();
    setCurrentPage('login');
    setVisualizationState({
      currentViewIndex: 0,
      views: [],
      maxViews: 20
    });
  };

  // 검색 실행 (중복 제거됨)
  const handleSearch = requireAuth(async (
    query: string, 
    mode: SearchMode, 
    selectedSeedPaper?: string,
    filters?: SearchFilters // 필터 인자 추가 확인
  ) => {
    setIsLoading(true);
    
    try {
      let response;
      let view: any;
      
      // 1. 파일 기반 검색 (selectedSeedPaper 존재 시)
      if (selectedSeedPaper) {
         // 파일 검색은 내부 RAG 엔진을 사용하므로 searchSimilarity 호출
         response = await ApiService.searchSimilarity(selectedSeedPaper, 5);
         
         // 시각화 뷰 생성 (Internal 뷰 포맷 사용)
         view = SearchService.transformInternalToVisualizationView(
           response, 
           `File: ${query}`, // 쿼리에는 파일 제목이 들어옴
           'internal', 
           selectedSeedPaper
         );
         
         setVisualizationState({ currentViewIndex: 0, views: [view], maxViews: 20 });
         setCurrentPage('visualization');
         return; 
      }

      // 2. 텍스트 기반 검색
      if (mode === 'external') {
        const limit = filters?.limit || 5;
        response = await ApiService.searchExternal(query, limit, filters);
        view = SearchService.transformExternalToVisualizationView(
          response, query, mode, undefined, undefined, filters
        );
      } else {
        response = await ApiService.searchInternal(query, 5, 0.7);
        view = SearchService.transformInternalToVisualizationView(
          response, query, mode, undefined
        );
      }
      
      // 뷰 업데이트 로직
      setVisualizationState(prev => {
        // 이미 시각화 페이지에 있고, 같은 모드에서 검색한 경우 -> 히스토리에 추가
        if (currentPage === 'visualization' && prev.views.length > 0) {
          const newViews = [...prev.views, view];
          // 최대 개수 제한
          if (newViews.length > prev.maxViews) {
            newViews.shift();
          }
          
          return {
            ...prev,
            currentViewIndex: newViews.length - 1, // 가장 최신 뷰로 이동
            views: newViews
          };
        }
        
        // 홈에서 검색하거나 모드가 바뀐 경우 -> 초기화
        return {
          currentViewIndex: 0,
          views: [view],
          maxViews: 20
        };
      });

      setCurrentPage('visualization');
    } catch (error) {
      console.error('Search failed:', error);
      alert(`검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  });

  // 노드 클릭 처리
  const handleNodeClick = requireAuth(async (nodeId: string) => {
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
  });

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
    if (currentPage === 'login') {
      return (
        <LoginPage
          onLogin={handleLogin}
          onNavigateToRegister={() => setCurrentPage('register')}
          isLoading={authLoading}
        />
      );
    }
    
    if (currentPage === 'register') {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onNavigateToLogin={() => setCurrentPage('login')}
          onNavigateToVerificationPending={handleNavigateToVerificationPending}
          isLoading={authLoading}
        />
      );
    }

    // 이메일 인증 대기 페이지
    if (currentPage === 'verification-pending') {
      return (
        <EmailVerificationPendingPage
          email={pendingVerificationEmail}
          onResendEmail={handleResendVerification}
          onNavigateToLogin={() => setCurrentPage('login')}
          isLoading={authLoading}
        />
      );
    }

    // 이메일 인증 페이지
    if (currentPage === 'verify-email') {
      return (
        <EmailVerificationPage
          token={verificationToken}
          onVerify={handleVerifyEmail}
          onNavigateToLogin={() => setCurrentPage('login')}
          isLoading={authLoading}
        />
      );
    }

    // 인증된 사용자만 접근 가능한 페이지들
    if (!isAuthenticated) {
      return null;
    }
    
    if (currentPage === 'home') {
      return (
        <HomePage
          onSearch={handleSearch}
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
    
    const currentView = visualizationState.views[visualizationState.currentViewIndex];

    return (
      <VisualizationPage
        key={currentView?.id}
        views={visualizationState.views}
        currentViewIndex={visualizationState.currentViewIndex}
        onNodeClick={handleNodeClick}
        onNavigateToView={handleCarouselNavigation}
        onSearch={handleSearch}
      />
    );
  };

  // 로그인/회원가입/이메일 인증 페이지는 레이아웃 없이 표시
  if (currentPage === 'login' || 
      currentPage === 'register' || 
      currentPage === 'verify-email' || 
      currentPage === 'verification-pending') {
    return renderCurrentPage();
  }

  return (
    <MainLayout
      visualizationState={visualizationState}
      onNavigateToView={handleBreadcrumbNavigation}
      onOpenLibrary={handleOpenLibrary}
      // 중복된 showSidebar 제거 및 로직 통합
      showSidebar={currentPage === 'visualization'}
      onLogout={handleLogout}
      isAuthenticated={isAuthenticated}  
      currentUser={currentUser}          
      onLogin={() => setCurrentPage('login')} 
    >
      {renderCurrentPage()}
    </MainLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider initialMode="external">
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;