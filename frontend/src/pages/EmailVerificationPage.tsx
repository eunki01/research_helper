// pages/EmailVerificationPage.tsx

import React, { useEffect, useState, useRef } from 'react';

interface EmailVerificationPageProps {
  token: string;
  onVerify: (token: string) => Promise<void>;
  onNavigateToLogin: () => void;
  isLoading: boolean;
}

export const EmailVerificationPage: React.FC<EmailVerificationPageProps> = ({
  token,
  onVerify,
  onNavigateToLogin,
  isLoading
}) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    const verify = async () => {
      if (hasVerified.current) return; 
      hasVerified.current = true; 
      try {
        await onVerify(token);
        setStatus('success');
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : '인증에 실패했습니다.');
      }
    };

    if (token) {
      verify();
    } else {
      setStatus('error');
      setErrorMessage('유효하지 않은 인증 링크입니다.');
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8">
          {(status === 'verifying' || isLoading) && (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <svg 
                  className="w-8 h-8 text-blue-500 animate-spin" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                이메일 인증 중...
              </h2>
              <p className="text-gray-600">
                잠시만 기다려주세요.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg 
                  className="w-8 h-8 text-green-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                이메일 인증 완료!
              </h2>
              <p className="text-gray-600 mb-6">
                계정이 성공적으로 활성화되었습니다.
              </p>
              <button
                onClick={onNavigateToLogin}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                로그인하러 가기
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg 
                  className="w-8 h-8 text-red-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                인증 실패
              </h2>
              <p className="text-gray-600 mb-4">
                {errorMessage}
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  인증 링크가 만료되었거나 이미 사용된 링크일 수 있습니다.
                </p>
              </div>
              <button
                onClick={onNavigateToLogin}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                로그인 페이지로 돌아가기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};