import type { RegisterRequest, AuthResponse, User } from '../types/auth';

const API_BASE_URL = 'http://localhost:8000';

export class AuthService {
  private static TOKEN_KEY = 'auth_token';

  // 로그인
  static async login(email: string, password: string): Promise<AuthResponse> {
    const createFormUrlEncoded = (data: any) => {
      return Object.keys(data)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
        .join('&');
    };
    
    const loginData = {
      username: email,
      password: password,
    };

    const formBody = createFormUrlEncoded(loginData);
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '로그인에 실패했습니다.');
    }

    return await response.json();
  }

  

  // 회원가입
  static async register(Email: string, Password: string, Name: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Email, Name, Password } as RegisterRequest),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '회원가입에 실패했습니다.');
    }

    return await response.json();
  }

  // 토큰 검증
  static async verifyToken(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('토큰이 유효하지 않습니다.');
    }

    const data = await response.json();
    return data.user;
  }

  // 토큰 저장
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // 토큰 가져오기
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // 토큰 삭제 (로그아웃)
  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static async verifyEmail(token: string): Promise<void> {
  // GET 요청은 query parameter로 토큰 전달
  const response = await fetch(`${API_BASE_URL}/users/verify-email?token=${token}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '이메일 인증에 실패했습니다.');
  }

  return await response.json();
}

  // 🆕 인증 이메일 재발송
  static async resendVerification(email: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/resend-verification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '인증 이메일 재발송에 실패했습니다.');
    }

    return await response.json();
  }

  // 인증된 요청을 위한 헤더 생성
  static getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }
}