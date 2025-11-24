// context/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthContextType } from '../types/auth';
import { AuthService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 앱 시작시 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const token = AuthService.getToken();
      
      if (token) {
        try {
          const user = await AuthService.verifyToken(token);
          setIsAuthenticated(true);
          setCurrentUser(user);
        } catch (error) {
          console.error('Token verification failed:', error);
          AuthService.logout();
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await AuthService.login(email, password);
      
      AuthService.setToken(response.token);
      setIsAuthenticated(true);
      setCurrentUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    try {
      await AuthService.register(email, password, name);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const verifyEmail = async (token: string) => {
    console.log('=== verifyEmail 호출됨 ===');
    console.log('받은 토큰:', token);
    setIsLoading(true);
    
    try {
      console.log('AuthService.verifyEmail 호출 시작');
      await AuthService.verifyEmail(token);
      console.log('AuthService.verifyEmail 호출 성공');
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async (email: string) => {
    setIsLoading(true);
    
    try {
      await AuthService.resendVerification(email);
    } catch (error) {
      console.error('Resend verification failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        register,
        logout,
        verifyEmail,
        resendVerification,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};