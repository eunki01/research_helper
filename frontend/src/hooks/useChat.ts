import { useState, useCallback, useRef } from 'react';
import ApiService from '../services/apiService';
import type { Message } from '../types/api';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 메시지 전송 및 스트리밍 응답 처리
   */
  const sendMessage = useCallback(async (query: string, targetTitles?: string[]) => {
    if (!query.trim()) return;

    // 1. 사용자 메시지 추가
    const userMessage: Message = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // 2. AI 메시지 플레이스홀더 추가 (빈 상태로 시작)
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    // 이전 스트림이 있다면 중단
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // 3. 스트리밍 API 호출
      // 현재 메시지 목록(history)에는 방금 추가한 userMessage가 포함되어 있지 않으므로 명시적으로 전달
      const history = [...messages, userMessage];
      
      const stream = ApiService.chatStream(query, history, targetTitles);

      let fullContent = '';

      for await (const chunk of stream) {
        fullContent += chunk;
        
        // 실시간으로 마지막 메시지(AI 답변) 업데이트
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === 'assistant') {
            lastMsg.content = fullContent;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Chat stream error:', error);
      setMessages((prev) => [
        ...prev, 
        { role: 'system', content: '답변을 생성하는 도중 오류가 발생했습니다.' }
      ]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages]);

  /**
   * 대화 기록 초기화
   */
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat
  };
};