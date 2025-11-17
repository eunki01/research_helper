import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import type { VisualizationState } from '../../types/visualization';

interface MainLayoutProps {
  children: React.ReactNode;
  visualizationState?: VisualizationState;
  onNavigateToView?: (viewIndex: number) => void;
  onOpenLibrary?: () => void;
  showSidebar?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  visualizationState,
  onNavigateToView,
  onOpenLibrary,
  showSidebar = false
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        visualizationState={visualizationState}
        onNavigateToView={onNavigateToView}
        onOpenLibrary={onOpenLibrary}
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
