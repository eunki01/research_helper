// 사용자 타입
export interface User {
    id: string;
    name: string;
    email: string;
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
export interface AuthResponse {
    user: User;
    token: string;
}