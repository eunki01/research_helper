import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import type { VisualizationState } from '../../types/visualization';
import type { User } from '../../types/auth';

interface MainLayoutProps {
  children: React.ReactNode;
  visualizationState?: VisualizationState;
  onNavigateToView?: (viewIndex: number) => void;
  onOpenLibrary?: () => void;
  showSidebar?: boolean;
  isAuthenticated?: boolean;
  currentUser?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  visualizationState,
  onNavigateToView,
  onOpenLibrary,
  showSidebar = false,
  isAuthenticated = false,
  currentUser = null,
  onLogin,
  onLogout
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        visualizationState={visualizationState}
        onNavigateToView={onNavigateToView}
        onOpenLibrary={onOpenLibrary}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLogin={onLogin}
        onLogout={onLogout}
      />
      <div className={`${showSidebar ? 'flex' : ''} h-screen pt-16`}>
        {showSidebar && <Sidebar />}
        <main className={`${showSidebar ? 'flex-1 overflow-hidden' : 'w-full'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
