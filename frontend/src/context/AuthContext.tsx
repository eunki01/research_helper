import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/AuthService';
import type { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        // 토큰이 있으면 사용자 정보 가져오기
        try {
          // const userData = await authService.getCurrentUser();
          // setUser(userData);
        } catch (error) {
          authService.clearToken();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    authService.saveToken(response.token);
    setUser(response.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await authService.signup({ name, email, password });
    authService.saveToken(response.token);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};