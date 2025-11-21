import React, { useState, useEffect, useCallback } from 'react';
import GraphComponent from '../visualization/GraphComponent';
import Sidebar from '../layout/Sidebar';
import type { VisualizationView, PaperNode } from '../../types/visualization';

interface VisualizationSlideProps {
  view: VisualizationView;
  onNodeClick: (nodeId: string) => Promise<void>;
  onSidebarExplore?: (nodeId: string) => Promise<void>;
}

const VisualizationSlide: React.FC<VisualizationSlideProps> = ({
  view,
  onNodeClick,
  onSidebarExplore
}) => {
  const [selectedPaper, setSelectedPaper] = useState<PaperNode | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  // 시드 노드를 기본 선택된 논문으로 설정
  useEffect(() => {
    if (view.graph.seedNodeId && !selectedPaper) {
      const seedNode = view.graph.nodes.find((n: any) => n.id === view.graph.seedNodeId);
      if (seedNode) {
        setSelectedPaper(seedNode);
      }
    }
  }, [view.graph.seedNodeId, view.graph.nodes, selectedPaper]);

  // 노드 클릭 처리 (더블클릭으로 확장, 로딩 표시 없음)
  const handleNodeClick = async (nodeId: string) => {
    try {
      // 새로운 시각화 생성 (로딩 표시 없이)
      await onNodeClick(nodeId);
    } catch (error) {
      console.error('Node expansion failed:', error);
    }
  };

  // 사이드바 확장 버튼 클릭 처리 (로딩 표시 포함)
  const handleSidebarExplore = async (nodeId: string) => {
    // 로딩 상태 설정
    setIsExpanding(true);
    
    try {
      // 새로운 시각화 생성
      if (onSidebarExplore) {
        await onSidebarExplore(nodeId);
      } else {
        await onNodeClick(nodeId);
      }
    } catch (error) {
      console.error('Node expansion failed:', error);
    } finally {
      // 로딩 상태 해제
      setIsExpanding(false);
    }
  };

  // 노드 단일 클릭 처리 (사이드 패널 정보 표시)
  const handleNodeSelect = useCallback((event: CustomEvent) => {
    const { nodeId } = event.detail;
    const node = view.graph.nodes.find((n: any) => n.id === nodeId);
    if (node) {
      setSelectedPaper(node);
    }
  }, [view.graph.nodes]);

  useEffect(() => {
    window.addEventListener('nodeSelect', handleNodeSelect as EventListener);
    return () => {
      window.removeEventListener('nodeSelect', handleNodeSelect as EventListener);
    };
  }, [handleNodeSelect]);

  return (
    <div className="w-full h-full flex-shrink-0">
      <div className="flex h-full">
        {/* 메인 시각화 영역 */}
        <div className="flex-1 relative">
          {/* 시각화 헤더 */}
          <div className="absolute top-6 left-6 z-10 bg-white rounded-xl shadow-xl border-2 border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {view.title}
            </h2>
            <p className="text-base text-gray-600 mb-1">
              {view.graph.nodes.length}개 노드 • {view.graph.edges.length}개 연결
            </p>
            {view.graph.query && (
              <p className="text-sm text-gray-500 mt-1">
                검색: "{view.graph.query}"
              </p>
            )}
          </div>

          {/* 확장 로딩 오버레이 */}
          {isExpanding && (
            <div className="absolute inset-0 z-20 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-2xl px-8 py-6 flex items-center space-x-4">
                <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div>
                  <p className="text-lg font-semibold text-gray-900">논문 확장 중...</p>
                  <p className="text-sm text-gray-600">유사한 논문들을 찾고 있습니다</p>
                </div>
              </div>
            </div>
          )}

          {/* 그래프 컴포넌트 */}
          <GraphComponent
            graph={view.graph}
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedPaper?.id}
            isExpanding={isExpanding}
            searchMode={view.graph.searchMode}
          />
          
          {/* 그래프 컨트롤 */}
          <div className="absolute bottom-6 right-6 flex flex-col space-y-3">
            <button className="p-3 bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:bg-gray-50 transition-colors" title="검색">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="p-3 bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:bg-gray-50 transition-colors" title="전체 보기">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button className="p-3 bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:bg-gray-50 transition-colors" title="줌 인">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          {/* 로딩 오버레이 (노드 확장 중일 때) */}
          {isExpanding && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-20">
              <div className="bg-white rounded-xl p-8 text-center shadow-2xl border-2 border-gray-200">
                <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                <p className="text-gray-700 font-semibold text-lg mb-2">관련 논문을 찾고 있습니다...</p>
                <p className="text-base text-gray-500">잠시만 기다려주세요</p>
              </div>
            </div>
          )}
        </div>

        {/* 사이드 패널 */}
        <Sidebar 
          selectedPaper={selectedPaper?.data as any} 
          onExplorePaper={handleSidebarExplore}
        />
      </div>
    </div>
  );
};

export default VisualizationSlide;
