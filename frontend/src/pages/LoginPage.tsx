// pages/LoginPage.tsx

import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onNavigateToRegister: () => void;
  isLoading: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onNavigateToRegister,
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
            논문 검색 및 관리 시스템
          </p>
        </div>
        
        <LoginForm
          onLogin={onLogin}
          onNavigateToRegister={onNavigateToRegister}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};