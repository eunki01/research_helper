import React from 'react';

interface AuthButtonProps {
    text: string;
    onClick?: () => void;
    type?: 'button' | 'submit';
    isLoading?: boolean;
    variant?: 'primary' | 'secondary';
}

const AuthButton: React.FC<AuthButtonProps> = ({
    text,
    onClick,
    type = 'button',
    isLoading = false,
    variant = 'primary'
}) => {
    const baseStyle = "w-full py-3 rounded-lg font-medium transition-colors";
    const variantStyle = variant === 'primary'
        ? "bg-blue-500 text-white hover:bg-blue-600"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300";

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isLoading}
            className={`${baseStyle} ${variantStyle} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {isLoading ? 'Ã³¸® Áß...' : text}
        </button>
    );
};

export default AuthButton;