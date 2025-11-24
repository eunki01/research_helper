import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../../types/api';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm overflow-hidden ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
        }`}
      >
        {/* ReactMarkdown 적용 */}
        <div className={`markdown-content ${isUser ? 'text-white' : 'text-gray-800'}`}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // 리스트 스타일링
              ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2" {...props} />,
              // 링크 스타일링
              a: ({node, ...props}) => (
                <a 
                  {...props} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`underline font-medium ${isUser ? 'text-white' : 'text-blue-600 hover:text-blue-800'}`} 
                />
              ),
              // 인용문 스타일링
              blockquote: ({node, ...props}) => (
                <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic text-gray-600" {...props} />
              ),
              // 코드 블록 및 인라인 코드 스타일링
              code: ({node, className, ...props}) => {
                const isInline = !className; // 간단한 인라인 체크
                return (
                  <code 
                    className={`${className} ${
                      isUser 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-red-500'
                    } px-1 py-0.5 rounded text-xs font-mono`} 
                    {...props} 
                  />
                );
              },
              // 문단 간격 조정
              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
              // 테이블 스타일링
              table: ({node, ...props}) => (
                <div className="overflow-x-auto my-2">
                  <table className="min-w-full border-collapse text-xs" {...props} />
                </div>
              ),
              th: ({node, ...props}) => (
                <th className="border border-gray-300 px-2 py-1 bg-gray-50 font-semibold" {...props} />
              ),
              td: ({node, ...props}) => (
                <th className="border border-gray-300 px-2 py-1" {...props} />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;