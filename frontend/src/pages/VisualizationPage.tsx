import React, { useState } from 'react';
import GraphComponent from '../components/visualization/GraphComponent';
import ChatPanel from '../components/chat/ChatPanel';
import Sidebar from '../components/layout/Sidebar';
import type { VisualizationState } from '../types/visualization';
import type { LibraryPaper } from '../types/paper';

interface VisualizationPageProps {
  views: VisualizationState['views'];
  currentViewIndex: number;
  onNodeClick: (nodeId: string) => void;
  onNavigateToView?: (viewIndex: number) => void;
}

const VisualizationPage: React.FC<VisualizationPageProps> = ({
  views,
  currentViewIndex,
  onNodeClick,
}) => {
  const currentView = views[currentViewIndex];
  
  const [chatContextPapers, setChatContextPapers] = useState<LibraryPaper[]>([]);
  const [selectedNodeForSidebar, setSelectedNodeForSidebar] = useState<LibraryPaper | undefined>(undefined);
  const [searchSeedPaper, setSearchSeedPaper] = useState<LibraryPaper | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);

  const isExternalMode = currentView.graph.searchMode === 'external';

  const convertNodeToPaper = (nodeData: any): LibraryPaper => ({
    id: nodeData.id,
    title: nodeData.title || nodeData.label || 'Unknown Title',
    authors: Array.isArray(nodeData.authors) 
      ? nodeData.authors 
      : (nodeData.authors ? [{ name: nodeData.authors }] : []),
    type: nodeData.type || 'paper',
    publicationDate: nodeData.publicationDate,
    abstract: nodeData.abstract,
    uploadedAt: nodeData.uploadedAt || new Date().toISOString(),
    venue: nodeData.venue,
    citationCount: nodeData.citationCount,
    tldr: nodeData.tldr,
    fieldsOfStudy: nodeData.fieldsOfStudy
  });

  const handleGraphNodeClick = (nodeData: any) => {
    const paper = convertNodeToPaper(nodeData);
  
    if (!isExternalMode) {
      const isAlreadySelected = chatContextPapers.some(p => p.id === paper.id);
      if (isAlreadySelected) {
        setChatContextPapers(prev => prev.filter(p => p.id !== paper.id));
        if (selectedNodeForSidebar?.id === paper.id) {
          setSelectedNodeForSidebar(undefined);
        }
      } else {
        setChatContextPapers(prev => [...prev, paper]);
        setSelectedNodeForSidebar(paper);
      }
    }

    if (selectedNodeForSidebar?.id === paper.id) {
        setSelectedNodeForSidebar(undefined);
    } else {
        setSelectedNodeForSidebar(paper);
    }
  };

  const handleGraphNodeRightClick = (nodeData: any) => {
    const paper = convertNodeToPaper(nodeData);
    setSearchSeedPaper(prev => (prev?.id === paper.id ? null : paper));
  };

  const handleExecuteSearch = () => {
    if (searchSeedPaper) {
      onNodeClick(searchSeedPaper.id);
    }
  };

  const handlePaperRemove = (paperId: string) => {
    setChatContextPapers(prev => prev.filter(p => p.id !== paperId));
  };

  if (!currentView) return <div className="flex items-center justify-center h-full text-gray-500">시각화 데이터가 없습니다.</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white relative">
      {/* 1. 좌측: 채팅 패널 */}
      {!isExternalMode && (
      <div 
        className={`border-r border-gray-200 flex flex-col bg-gray-50 z-10 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${
          isChatOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-bold text-gray-800 flex items-center">
            <span className="text-xl mr-2">💬</span> 
            연구 도우미
          </h2>
          <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatPanel 
            initialSelectedPapers={chatContextPapers}
            onSelectedPapersChange={setChatContextPapers}
            onPaperRemove={handlePaperRemove}
            placeholder="질문해보세요..."
            className="h-full"
          />
        </div>
      </div>
      )}

      {!isExternalMode && !isChatOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="absolute left-4 bottom-4 z-20 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="채팅 열기"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* 2. 중앙: 그래프 시각화 영역 */}
      <div className="flex-1 relative bg-gray-50 overflow-hidden">
        <GraphComponent 
          graphData={currentView.graph}
          onNodeClick={handleGraphNodeClick}
          onNodeRightClick={handleGraphNodeRightClick}
          selectedNodeIds={isExternalMode ? [] : chatContextPapers.map(p => p.id)} 
          seedNodeId={searchSeedPaper?.id}
          isExpanding={false}
        />
        
        {/* 그래프 정보 오버레이 (우측 상단) */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-gray-200 max-w-xs z-10 pointer-events-none">
          <h3 className="font-semibold text-sm mb-1 text-gray-700">Current View</h3>
          <p className="text-xs text-gray-600 line-clamp-2">"{currentView.query}"</p>
        </div>

        {/* 도움말 아이콘 (우측 하단) */}
        <div className="absolute bottom-6 right-6 z-20 group">
          {/* 아이콘 버튼 */}
          <div className="w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-300 cursor-help transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* 툴팁 (Hover 시 표시) */}
          <div className="absolute bottom-full right-0 mb-3 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="mr-1">💡</span> 그래프 사용법
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="font-semibold text-blue-600 min-w-[50px]">좌클릭</span>
                <span>논문 상세 정보 확인 및 채팅 추가/해제</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold text-red-500 min-w-[50px]">우클릭</span>
                <span>검색 시드(Seed) 논문 지정 (이후 사이드바에서 검색 실행)</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold text-gray-700 min-w-[50px]">드래그</span>
                <span>노드 위치 이동 및 그래프 탐색</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold text-gray-700 min-w-[50px]">휠</span>
                <span>그래프 확대/축소 (Zoom)</span>
              </li>
            </ul>
            {/* 말풍선 꼬리 */}
            <div className="absolute bottom-0 right-3 transform translate-y-1/2 rotate-45 w-3 h-3 bg-white border-r border-b border-gray-200"></div>
          </div>
        </div>
      </div>

      {/* 3. 우측: 사이드바 */}
      <Sidebar 
        selectedPaper={selectedNodeForSidebar}
        searchSeedPaper={searchSeedPaper}
        onExplorePaper={handleExecuteSearch}
      />
    </div>
  );
};

export default VisualizationPage;