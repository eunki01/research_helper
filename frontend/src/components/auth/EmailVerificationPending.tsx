import React, { useState } from 'react';

interface EmailVerificationPendingProps {
  email: string;
  onResendEmail: (email: string) => Promise<void>;
  onBackToLogin: () => void;
  isLoading: boolean;
}

export const EmailVerificationPending: React.FC<EmailVerificationPendingProps> = ({
  email,
  onResendEmail,
  onBackToLogin,
  isLoading
}) => {
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    setMessage('');
    
    try {
      await onResendEmail(email);
      setMessage('인증 이메일이 재발송되었습니다. 메일함을 확인해주세요.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '이메일 재발송에 실패했습니다.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg 
              className="w-8 h-8 text-blue-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            이메일 인증이 필요합니다
          </h2>
          <p className="text-gray-600 text-sm">
            회원가입이 완료되었습니다!
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-semibold">{email}</span>로 인증 이메일을 발송했습니다.
          </p>
          <p className="text-sm text-gray-600">
            이메일의 인증 링크를 클릭하여 계정을 활성화해주세요.
          </p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.includes('실패') 
              ? 'bg-red-100 border border-red-400 text-red-700'
              : 'bg-green-100 border border-green-400 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleResend}
            disabled={isResending || isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? '발송 중...' : '인증 이메일 재발송'}
          </button>

          <button
            onClick={onBackToLogin}
            disabled={isLoading}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2">
            💡 <span className="font-semibold">이메일이 오지 않나요?</span>
          </p>
          <ul className="text-xs text-gray-600 space-y-1 ml-4">
            <li>• 스팸 메일함을 확인해보세요</li>
            <li>• 이메일 주소가 올바른지 확인해보세요</li>
            <li>• 몇 분 후 다시 시도해보세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
};