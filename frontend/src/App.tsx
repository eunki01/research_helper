// src/App.tsx

import { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import VisualizationPage from './pages/VisualizationPage';
import LibraryPage from './pages/LibraryPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EmailVerificationPage } from './pages/EmailVerificationPage';
import { EmailVerificationPendingPage } from './pages/EmailVerificationPendingPage';

import { LibraryService } from './services/libraryService';
import ApiService from './services/apiService';
import SearchService from './services/searchService';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import type { VisualizationState } from './types/visualization';
import type { SearchMode } from './types/search';
import type { LibraryPaper } from './types/paper';

// App 컴포넌트를 테마 컨텍스트로 감싸기
const AppContent: React.FC = () => {
  const { searchMode, setSearchMode } = useTheme();
  const { isAuthenticated, currentUser, login, register, logout, verifyEmail, resendVerification, isLoading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'home' | 'visualization' | 'library' | 'login' | 'register' | 'verify-email' | 'verification-pending'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>('');
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [libraryPapers, setLibraryPapers] = useState<LibraryPaper[]>([]);
  const [visualizationState, setVisualizationState] = useState<VisualizationState>({
    currentViewIndex: 0,
    views: [],
    maxViews: 20
  });

  // 라이브러리 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      setLibraryPapers(LibraryService.getLibraryPapers());
    }
  }, [isAuthenticated]);

  // 인증 래퍼 함수
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

  // 🆕 이메일 인증 대기 페이지로 이동
  const handleNavigateToVerificationPending = (email: string) => {
    setPendingVerificationEmail(email);
    setCurrentPage('verification-pending');
  };

  // 🆕 이메일 인증 처리
  const handleVerifyEmail = async (token: string) => {
    await verifyEmail(token);
  };

  // 🆕 인증 이메일 재발송
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

  // 검색 실행
  const handleSearch = requireAuth(async (query: string, mode: SearchMode, selectedSeedPaper?: string) => {
    setIsLoading(true);
    
    try {
      // Seed 논문 제목 가져오기
      const seedPaper = libraryPapers.find(paper => paper.id === selectedSeedPaper);
      const seedPaperTitle = seedPaper?.title;
      
      // 실제 API 호출
      const mergedQuery = SearchService.mergeQueryWithSeedPaper(query, seedPaperTitle);
      
      let response;
      if (mode === 'external') {
        response = await ApiService.searchExternal(mergedQuery, 5);
        const view = SearchService.transformExternalToVisualizationView(
          response, 
          query, 
          mode, 
          selectedSeedPaper
        );
        
        setVisualizationState({
          currentViewIndex: 0,
          views: [view],
          maxViews: 20
        });
      } else {
        response = await ApiService.searchInternal(mergedQuery, 5, 0.7);
        const view = SearchService.transformInternalToVisualizationView(
          response, 
          query, 
          mode, 
          selectedSeedPaper
        );

      setVisualizationState({
        currentViewIndex: 0,
          views: [view],
        maxViews: 20
      });
      }
      
      setCurrentPage('visualization');
    } catch (error) {
      console.error('Search failed:', error);
      // 에러 처리 - 사용자에게 알림 표시할 수 있음
      alert(`검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  });

  // 노드 클릭 처리
  const handleNodeClick = requireAuth(async (nodeId: string) => {
    setIsLoading(true);
    
    try {
      // 클릭한 노드의 정보 가져오기
      const currentView = visualizationState.views[visualizationState.currentViewIndex];
      const clickedNode = currentView.graph.nodes.find((node: any) => node.id === nodeId);
      
      if (!clickedNode) {
        console.error('Clicked node not found:', nodeId);
        return;
      }
      
      // 클릭한 노드의 제목을 쿼리로 사용하여 재검색
      const query = clickedNode.data.title;
      const mode = currentView.graph.searchMode || 'external';
      
      let response;
      if (mode === 'external') {
        response = await ApiService.searchExternal(query, 5);
        const currentView = visualizationState.views[visualizationState.currentViewIndex];
        const newView = SearchService.transformExternalToVisualizationView(
          response, 
          query, 
          mode, 
          nodeId,
          currentView.breadcrumbPath
        );
        
        // 새로운 뷰를 현재 뷰 다음에 추가
        const newViews = [...visualizationState.views];
        const insertIndex = visualizationState.currentViewIndex + 1;
        
        // 최대 뷰 수 제한
        if (newViews.length >= visualizationState.maxViews) {
          newViews.shift();
        }
        
        newViews.splice(insertIndex, 0, newView);
        
        setVisualizationState({
          ...visualizationState,
          views: newViews,
          currentViewIndex: insertIndex
        });
      } else {
        response = await ApiService.searchInternal(query, 5, 0.7);
        const newView = SearchService.transformInternalToVisualizationView(
          response, 
          query, 
          mode, 
          nodeId,
          currentView.breadcrumbPath
        );
        
        // 새로운 뷰를 현재 뷰 다음에 추가
      const newViews = [...visualizationState.views];
      const insertIndex = visualizationState.currentViewIndex + 1;
      
      // 최대 뷰 수 제한
      if (newViews.length >= visualizationState.maxViews) {
        newViews.shift();
      }
      
      newViews.splice(insertIndex, 0, newView);
      
      setVisualizationState({
        ...visualizationState,
        views: newViews,
        currentViewIndex: insertIndex
      });
      }
      
    } catch (error) {
      console.error('Node expansion failed:', error);
      alert(`노드 확장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  });

  // 브레드크럼 네비게이션 (브레드크럼 인덱스 → 뷰 인덱스 변환)
  const handleBreadcrumbNavigation = (breadcrumbIndex: number) => {
    // 브레드크럼 인덱스를 뷰 인덱스로 변환
    // breadcrumbIndex 0 = 홈 (뷰 없음), breadcrumbIndex 1 = 뷰 인덱스 0
    const viewIndex = breadcrumbIndex - 1;
    
    if (viewIndex < 0) {
      // 홈으로 돌아가기 - 시각화 상태 완전 초기화
      setCurrentPage('home');
      setVisualizationState({
        currentViewIndex: 0,
        views: [],
        maxViews: 20
      });
      return;
    }
    
    setVisualizationState(prev => ({
      ...prev,
      currentViewIndex: viewIndex,
      // 이후 경로들 제거 (클릭한 뷰까지 포함)
      views: prev.views.slice(0, viewIndex + 1)
    }));
  };

  // 캐러셀 네비게이션 (뷰 인덱스 직접 사용)
  const handleCarouselNavigation = (viewIndex: number) => {
    setVisualizationState(prev => ({
      ...prev,
      currentViewIndex: viewIndex
    }));
  };

  // 검색 모드 변경
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
  };

  // 라이브러리 페이지로 이동
  const handleOpenLibrary = () => {
    setCurrentPage('library');
  };

  // 현재 페이지 렌더링
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

    // 🆕 이메일 인증 대기 페이지
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

    // 🆕 이메일 인증 페이지
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
      onLogout={handleLogout}
      showSidebar={currentPage === 'visualization'}
      isAuthenticated={isAuthenticated}  
      currentUser={currentUser}          
      onLogin={() => setCurrentPage('login')} 
    >
      {renderCurrentPage()}
    </MainLayout>
  );
}

// 메인 App 컴포넌트
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