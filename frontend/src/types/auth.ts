// 사용자 타입
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// 로그인 요청 타입
export interface LoginRequest {
  email: string;
  password: string;
}

// 회원가입 요청 타입
export interface SignupRequest {
    name: string;
    email: string;
    password: string;
}

// 인증 응답 타입
export interface RegisterRequest {
  Email: string;
  Name: string;
  Password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  isLoading: boolean;
}