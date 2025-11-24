// pages/RegisterPage.tsx

import React from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';

interface RegisterPageProps {
  onRegister: (email: string, password: string, name: string) => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateToVerificationPending: (email: string) => void;
  isLoading: boolean;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegister,
  onNavigateToLogin,
  onNavigateToVerificationPending,
  isLoading
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Research Paper Manager
          </h1>
          <p className="text-gray-600">
            새 계정 만들기
          </p>
        </div>
        
        <RegisterForm
          onRegister={onRegister}
          onNavigateToLogin={onNavigateToLogin}
          onNavigateToVerificationPending={onNavigateToVerificationPending}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};