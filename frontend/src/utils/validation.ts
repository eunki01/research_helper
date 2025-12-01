// 이메일 유효성 검사
export const validateEmail = (email: string): boolean => {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
};

// 비밀번호 유효성 검사
export const validatePassword = (password: string): boolean => {
    return password.length >= 8;
};

// 이름 유효성 검사
export const validateName = (name: string): boolean => {
    return name.trim().length > 0;
};

// 에러 메시지 생성
export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return '알 수 없는 오류가 발생했습니다.';
};