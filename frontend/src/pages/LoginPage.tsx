import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthInput from '../components/auth/AuthInput';
import AuthButton from '../components/auth/AuthButton';

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = '이메일을 입력해주세요.';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = '올바른 이메일 형식이 아닙니다.';
        }

        if (!password) {
            newErrors.password = '비밀번호를 입력해주세요.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await onLogin(email, password);
        } catch (error) {
            setErrors({ password: '로그인에 실패했습니다.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
            {/* 헤더 */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Research Navigator
                </h1>
                <p className="text-gray-600">
                    로그인하고 논문 탐색을 시작하세요
                </p>
            </div>

            {/* 로그인 폼 */}
            <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    로그인
                </h2>

                <form onSubmit={handleSubmit}>
                    <AuthInput
                        label="이메일"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        required
                        error={errors.email}
                    />

                    <AuthInput
                        label="비밀번호"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호를 입력하세요"
                        required
                        error={errors.password}
                    />

                    <div className="flex items-center justify-between mb-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-600">로그인 상태 유지</span>
                        </label>
                        <a href="#" className="text-sm text-blue-500 hover:text-blue-600">
                            비밀번호 찾기
                        </a>
                    </div>

                    <AuthButton
                        text="로그인"
                        type="submit"
                        isLoading={isLoading}
                        variant="primary"
                    />
                </form>

                {/* 회원가입 링크 */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        계정이 없으신가요?{' '}
                        <Link to="/signup" className="text-blue-500 hover:text-blue-600 font-medium">
                            회원가입
                        </Link>
                    </p>
                </div>

                {/* 소셜 로그인 (선택사항) */}
                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">또는</span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <button className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">Google</span>
                        </button>
                        <button className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">GitHub</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;