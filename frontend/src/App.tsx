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
import { useVisualizationState } from './hooks/visualization';
import type { VisualizationState, VisualizationView } from './types/visualization';
import type { SearchMode, SearchFilters } from './types/search';

// App 컴포넌트를 테마 컨텍스트로 감싸기
const AppContent: React.FC = () => {
  const { searchMode, setSearchMode } = useTheme();
  const { isAuthenticated, currentUser, login, register, logout, verifyEmail, resendVerification, isLoading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'home' | 'visualization' | 'library' | 'login' | 'register' | 'verify-email' | 'verification-pending'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>('');
  const [verificationToken, setVerificationToken] = useState<string>('');
  const {
    state: visualizationState,    
    loadState: loadVisualizationState,
    saveState: saveVisualizationState
  } = useVisualizationState();

  const [localVisualizationState, setLocalVisualizationState] = useState<VisualizationState>({
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

  // 서버에서 불러온 상태를 로컬 상태에 동기화
  useEffect(() => {
    if (visualizationState && visualizationState.views.length > 0) {
      setLocalVisualizationState(visualizationState);
    }
  }, [visualizationState]);

  // 로그인 상태 체크 및 시각화 상태 로드
  useEffect(() => {
    if (!isAuthenticated &&
      currentPage !== 'login' && 
      currentPage !== 'register' && 
      currentPage !== 'verify-email' && 
      currentPage !== 'verification-pending'
    ) {
      setCurrentPage('login');
      // 로그아웃 시 로컬 상태 초기화
      setLocalVisualizationState({
        currentViewIndex: 0,
        views: [],
        maxViews: 20
      });
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
    
    try {
        await loadVisualizationState(); 
    } catch (err) {
        console.error('Initial visualization state load failed after login:', err);
    }
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
    setLocalVisualizationState({
      currentViewIndex: 0,
      views: [],
      maxViews: 20
    });
  };

  // 시각화 상태를 서버에 저장하는 헬퍼 함수
  const saveVisualizationStateToServer = async (newState: VisualizationState) => {
    try {
      await saveVisualizationState(newState);
    } catch (error) {
      console.error('Failed to save visualization state:', error);
      // 저장 실패해도 로컬 상태는 유지
    }
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
      
      // 새로운 상태 계산
      const newState = (() => {
        // 수정 전: if (currentPage === 'visualization' && localVisualizationState.views.length > 0)
        // 수정 후: 페이지 상관없이 기존 뷰가 하나라도 있다면 '추가(Append)' 모드로 동작
        if (localVisualizationState.views.length > 0) {
          const newViews = [...localVisualizationState.views, view];
          
          // 최대 개수 제한 (가장 오래된 것 제거)
          if (newViews.length > localVisualizationState.maxViews) {
            newViews.shift(); 
          }
          
          return {
            ...localVisualizationState,
            currentViewIndex: newViews.length - 1, // 방금 추가한 맨 끝 뷰로 이동
            views: newViews
          };
        }
        
        // 기존 뷰가 아예 없을 때만 새로 생성
        return {
          currentViewIndex: 0,
          views: [view],
          maxViews: localVisualizationState.maxViews || 20
        };
      })();

      // 로컬 상태 업데이트 (즉시 UI 반영)
      setLocalVisualizationState(newState);
      
      // 서버에 저장 (백그라운드)
      saveVisualizationStateToServer(newState);

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
      let newView: VisualizationView;

      if (mode === 'external') {
        response = await ApiService.searchExternal(query, 5);
        newView = SearchService.transformExternalToVisualizationView(
          response, query, mode, nodeId, currentView.breadcrumbPath
        );
      } else {
        response = await ApiService.searchInternal(query, 5, 0.7);
        newView = SearchService.transformInternalToVisualizationView(
          response, query, mode, nodeId, currentView.breadcrumbPath
        );
      }
      // 새로운 상태 계산
      const newViews = [...localVisualizationState.views];
      const insertIndex = localVisualizationState.currentViewIndex + 1;
      
      // 최대 개수 제한
      if (newViews.length >= localVisualizationState.maxViews) {
        newViews.shift();
      }
      
      newViews.splice(insertIndex, 0, newView);
      
      const newState = {
        ...localVisualizationState,
        views: newViews,
        currentViewIndex: insertIndex
      };
      
      // 로컬 상태 업데이트
      setLocalVisualizationState(newState);
      
      // 서버에 저장
      saveVisualizationStateToServer(newState);
      
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
      return;
    }
    
    const newState = {
      ...localVisualizationState,
      currentViewIndex: viewIndex,
      views: localVisualizationState.views.slice(0, viewIndex + 1)
    };
    
    setLocalVisualizationState(newState);
    saveVisualizationStateToServer(newState);
  };

  const handleCarouselNavigation = (viewIndex: number) => {
    const newState = {
      ...localVisualizationState,
      currentViewIndex: viewIndex
    };
    
    setLocalVisualizationState(newState);
  };

  const handleDeleteView = async (viewId: string) => {
    const oldViews = localVisualizationState.views;
    const currentIndex = localVisualizationState.currentViewIndex;
    
    // 1. 삭제 대상 뷰의 인덱스 찾기
    const targetIndex = oldViews.findIndex(v => v.id === viewId);
    if (targetIndex === -1) return;

    // 2. 뷰 삭제 (새 배열 생성)
    const newViews = oldViews.filter(v => v.id !== viewId);

    // 3. 뷰가 하나도 안 남았다면? -> 홈으로 이동
    if (newViews.length === 0) {
      const emptyState = { currentViewIndex: 0, views: [], maxViews: 20 };
      setLocalVisualizationState(emptyState);
      saveVisualizationStateToServer(emptyState);
      setCurrentPage('home');
      return;
    }

    // 4. 인덱스 조정 로직
    let newIndex = currentIndex;

    if (targetIndex === currentIndex) {
      // 현재 보고 있는 뷰를 삭제한 경우: 이전 뷰(왼쪽)를 보여줌. 없으면 0번.
      newIndex = Math.max(0, currentIndex - 1);
    } else if (targetIndex < currentIndex) {
      // 내 앞의 뷰가 삭제된 경우: 인덱스를 1 당김
      newIndex = currentIndex - 1;
    }
    // 내 뒤의 뷰가 삭제된 경우: 인덱스 유지 (newIndex = currentIndex)

    const newState = {
      ...localVisualizationState,
      views: newViews,
      currentViewIndex: newIndex
    };

    setLocalVisualizationState(newState);
    await saveVisualizationStateToServer(newState);
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
          onClose={() => setCurrentPage('home')}
        />
      );
    }
    
const handleGraphUpdate = async (updatedGraph: any) => {
      // 1. 현재 뷰의 그래프를 업데이트한 새로운 뷰 생성
      const currentViewIndex = localVisualizationState.currentViewIndex;
      const newViews = [...localVisualizationState.views];
      
      // 현재 보고 있는 뷰의 그래프 교체
      newViews[currentViewIndex] = {
        ...newViews[currentViewIndex],
        graph: updatedGraph
      };

      const newState = {
        ...localVisualizationState,
        views: newViews
      };

      // 2. 로컬 상태 업데이트 (App 레벨)
      setLocalVisualizationState(newState);

      // 3. 서버 저장 (DB 반영)
      await saveVisualizationStateToServer(newState);
    };

    const currentView = localVisualizationState.views[localVisualizationState.currentViewIndex];

    if (!currentView) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>불러오는 중이거나 표시할 시각화 데이터가 없습니다.</p>
        </div>
      );
    }

    

    return (
      <VisualizationPage
        key={currentView.id} 
        views={localVisualizationState.views}
        currentViewIndex={localVisualizationState.currentViewIndex}
        onNodeClick={handleNodeClick}
        onNavigateToView={handleCarouselNavigation}
        onSearch={handleSearch}
        onUpdateGraph={handleGraphUpdate}
        onDeleteView={handleDeleteView}
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

  const handleNavigateToVisualization = () => {
    // 뷰가 하나라도 있을 때만 이동
    if (localVisualizationState.views.length > 0) {
      setCurrentPage('visualization');
    } else {
      alert("생성된 시각화 그래프가 없습니다. 검색을 먼저 진행해주세요.");
    }
  };

  return (
    <MainLayout
      visualizationState={visualizationState}
      onNavigateToView={handleBreadcrumbNavigation}
      onOpenLibrary={handleOpenLibrary}
      // 중복된 showSidebar 제거 및 로직 통합
      //showSidebar={currentPage === 'visualization'}
      onNavigateToVisualization={handleNavigateToVisualization}
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