import type { LoginRequest, SignupRequest, AuthResponse } from '../types/auth';

class AuthService {
    private baseUrl: string;

    constructor(baseUrl: string = '/api') {
        this.baseUrl = baseUrl;
    }

    // 로그인 메서드
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '로그인에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // 회원가입 메서드
    async signup(userData: SignupRequest): Promise<AuthResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '회원가입에 실패했습니다.');
            }

            return await response.json();
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    }

    // 로그아웃 메서드
    async logout(): Promise<void> {
        try {
            await fetch(`${this.baseUrl}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            });
        } finally {
            this.clearToken();
        }
    }

    // 토큰 저장
    saveToken(token: string): void {
        localStorage.setItem('auth_token', token);
    }

    // 토큰 가져오기
    getToken(): string | null {
        return localStorage.getItem('auth_token');
    }

    // 토큰 삭제
    clearToken(): void {
        localStorage.removeItem('auth_token');
    }

    // 인증 상태 확인
    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}

// 싱글톤 인스턴스 export
export const authService = new AuthService();

// 클래스도 export (테스트나 커스텀 인스턴스용)
export default AuthService;