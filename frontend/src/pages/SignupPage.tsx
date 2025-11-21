import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthInput from '../components/auth/AuthInput';
import AuthButton from '../components/auth/AuthButton';

interface SignupPageProps {
    onSignup: (name: string, email: string, password: string) => Promise<void>;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignup }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        terms?: string;
    }>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors: {
            name?: string;
            email?: string;
            password?: string;
            confirmPassword?: string;
            terms?: string;
        } = {};

        if (!name.trim()) {
            newErrors.name = '이름을 입력해주세요.';
        }

        if (!email) {
            newErrors.email = '이메일을 입력해주세요.';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = '올바른 이메일 형식이 아닙니다.';
        }

        if (!password) {
            newErrors.password = '비밀번호를 입력해주세요.';
        } else if (password.length < 8) {
            newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        }

        if (!agreeTerms) {
            newErrors.terms = '이용약관에 동의해주세요.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await onSignup(name, email, password);
        } catch (error) {
            setErrors({ email: '회원가입에 실패했습니다.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
            {/* 헤더 */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Research Navigator
                </h1>
                <p className="text-gray-600">
                    새로운 연구 여정을 시작하세요
                </p>
            </div>

            {/* 회원가입 폼 */}
            <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                    회원가입
                </h2>

                <form onSubmit={handleSubmit}>
                    <AuthInput
                        label="이름"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="홍길동"
                        required
                        error={errors.name}
                    />

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
                        placeholder="8자 이상 입력하세요"
                        required
                        error={errors.password}
                    />

                    <AuthInput
                        label="비밀번호 확인"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="비밀번호를 다시 입력하세요"
                        required
                        error={errors.confirmPassword}
                    />

                    {/* 이용약관 동의 */}
                    <div className="mb-6">
                        <label className="flex items-start">
                            <input
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500 mt-1"
                            />
                            <span className="ml-2 text-sm text-gray-600">
                                <a href="#" className="text-blue-500 hover:text-blue-600">
                                    이용약관
                                </a>
                                {' '}및{' '}
                                <a href="#" className="text-blue-500 hover:text-blue-600">
                                    개인정보처리방침
                                </a>
                                에 동의합니다.
                            </span>
                        </label>
                        {errors.terms && (
                            <p className="text-red-500 text-sm mt-1">{errors.terms}</p>
                        )}
                    </div>

                    <AuthButton
                        text="회원가입"
                        type="submit"
                        isLoading={isLoading}
                        variant="primary"
                    />
                </form>

                {/* 로그인 링크 */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        이미 계정이 있으신가요?{' '}
                        <Link to="/login" className="text-blue-500 hover:text-blue-600 font-medium">
                            로그인
                        </Link>
                    </p>
                </div>

                {/* 소셜 회원가입 (선택사항) */}
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

            {/* 하단 안내 */}
            <div className="mt-8 text-center max-w-md">
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-500">
                    <div>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                            <span className="text-blue-500 font-bold">1</span>
                        </div>
                        <p>무료 가입</p>
                    </div>
                    <div>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                            <span className="text-blue-500 font-bold">2</span>
                        </div>
                        <p>논문 업로드</p>
                    </div>
                    <div>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                            <span className="text-blue-500 font-bold">3</span>
                        </div>
                        <p>연구 시작</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;