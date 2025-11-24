import React from 'react';
import type { VisualizationState } from '../../types/visualization';
import Breadcrumb from '../navigation/Breadcrumb';
import { useTheme } from '../../context/ThemeContext';
import type { User } from '../../types/auth';

interface HeaderProps {
  visualizationState?: VisualizationState;
  onNavigateToView?: (viewIndex: number) => void;
  onOpenLibrary?: () => void;
  isAuthenticated?: boolean;
  currentUser?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  visualizationState,
  onNavigateToView,
  onOpenLibrary,
  isAuthenticated = false,
  currentUser = null,
  onLogin,
  onLogout
}) => {
  const { theme } = useTheme();
  console.log('Header - isAuthenticated:', isAuthenticated);
  console.log('Header - currentUser:', currentUser);

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm transition-colors duration-300"
      style={{ borderBottomColor: theme.border, borderBottomWidth: '2px' }}
    >
      <div className="flex items-center justify-between h-16 px-6">
        {/* 로고 */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900">
            Research Navigator
          </h1>
        </div>

        {/* 브레드크럼 */}
        {visualizationState && visualizationState.views.length > 0 && (
          <div className="flex-1 mx-8">
            <Breadcrumb 
              items={visualizationState.views[visualizationState.currentViewIndex]?.breadcrumbPath || []}
              onNavigate={onNavigateToView}
            />
          </div>
        )}

        {/* 사용자 메뉴 */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* 라이브러리 버튼 */}
              <button
                onClick={onOpenLibrary}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                📚 라이브러리
              </button>

              {/* 사용자 정보 (옵션) */}
              {currentUser && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">
                    {currentUser.name || currentUser.email}
                  </p>
                </div>
              )}

              {/* 로그아웃 버튼 */}
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            /* 로그인 버튼 */
            <button
              onClick={onLogin}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
