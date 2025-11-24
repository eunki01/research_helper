import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import ChatBubble from './ChatBubble';
import LibraryModal from '../library/LibraryModal';
import type { LibraryPaper } from '../../types/paper';

interface ChatPanelProps {
  initialSelectedPapers?: LibraryPaper[]; 
  onSelectedPapersChange?: (papers: LibraryPaper[]) => void;
  onPaperRemove?: (paperId: string) => void;
  placeholder?: string;
  className?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  initialSelectedPapers, // [수정] 기본값 [] 제거 (undefined 허용)
  onSelectedPapersChange,
  onPaperRemove,
  placeholder = "연구 내용에 대해 질문해보세요...",
  className = ""
}) => {
  const { messages, isLoading, sendMessage } = useChat();
  const [input, setInput] = useState('');
  
  // 파일 선택 상태 관리 (초기값 설정 시 빈 배열 fallback)
  const [selectedPapers, setSelectedPapers] = useState<LibraryPaper[]>(initialSelectedPapers || []);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // [수정] initialSelectedPapers가 명시적으로 제공되었을 때만 동기화
  useEffect(() => {
    if (initialSelectedPapers !== undefined) {
      setSelectedPapers(initialSelectedPapers);
    }
  }, [initialSelectedPapers]);

  // 내부 상태 변경 및 부모 알림
  const updateSelectedPapers = (newPapers: LibraryPaper[]) => {
    setSelectedPapers(newPapers);
    onSelectedPapersChange?.(newPapers);
  };

  // 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const targetIds = selectedPapers.map(p => p.id);
    sendMessage(input, targetIds);
    setInput('');
  };

  const handleAddPaper = (paper: LibraryPaper) => {
    // 이미 선택된 파일인지 확인
    if (!selectedPapers.find(p => p.id === paper.id)) {
      updateSelectedPapers([...selectedPapers, paper]);
    }
  };

  const handleRemovePaper = (paperId: string) => {
    const newPapers = selectedPapers.filter(p => p.id !== paperId);
    updateSelectedPapers(newPapers);
    onPaperRemove?.(paperId);
  };

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* 1. 메시지 목록 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-60">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm">연구 내용에 대해 질문해보세요.</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} message={msg} />
        ))}
        
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start mb-4">
             <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
               <div className="flex space-x-1">
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 2. 선택된 파일 표시 영역 (Chips) */}
      {selectedPapers.length > 0 && (
        <div className="px-4 py-2 bg-white border-t border-gray-100 flex flex-wrap gap-2 max-h-24 overflow-y-auto">
          {selectedPapers.map(paper => (
            <div key={paper.id} className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs border border-blue-100 animate-fade-in">
              <span className="truncate max-w-[150px]">{paper.title}</span>
              <button 
                onClick={() => handleRemovePaper(paper.id)}
                className="ml-1 text-blue-400 hover:text-blue-600 font-bold p-0.5 rounded-full hover:bg-blue-100"
                title="제거"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 3. 입력 폼 영역 */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="relative flex gap-2">
          {/* 파일 첨부 버튼 */}
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            title="라이브러리에서 논문 첨부"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-100 outline-none placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-xl transition-colors ${
              input.trim() && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>

      {/* 라이브러리 모달 */}
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectPaper={(paper) => {
            handleAddPaper(paper);
            // 연속 선택을 원할 경우 아래 주석 유지
            // setIsLibraryOpen(false); 
        }}
        selectedPaperId={selectedPapers[selectedPapers.length - 1]?.id} 
      />
    </div>
  );
};

export default ChatPanel;