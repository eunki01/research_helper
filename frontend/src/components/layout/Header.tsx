import React from 'react';
import type { VisualizationState } from '../../types/visualization';
import Breadcrumb from '../navigation/Breadcrumb';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  visualizationState?: VisualizationState;
  onNavigateToView?: (viewIndex: number) => void;
  onOpenLibrary?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  visualizationState,
  onNavigateToView,
  onOpenLibrary
}) => {
  const { theme } = useTheme();
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
        <div className="flex items-center space-x-4">
          <button 
            onClick={onOpenLibrary}
            className="text-gray-600 hover:text-gray-900" 
            title="라이브러리"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
          <button className="text-gray-600 hover:text-gray-900" title="설정">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button className="text-gray-600 hover:text-gray-900" title="프로필">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
