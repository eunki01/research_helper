// pages/EmailVerificationPendingPage.tsx

import React from 'react';
import { EmailVerificationPending } from '../components/auth/EmailVerificationPending';

interface EmailVerificationPendingPageProps {
  email: string;
  onResendEmail: (email: string) => Promise<void>;
  onNavigateToLogin: () => void;
  isLoading: boolean;
}

export const EmailVerificationPendingPage: React.FC<EmailVerificationPendingPageProps> = ({
  email,
  onResendEmail,
  onNavigateToLogin,
  isLoading
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <EmailVerificationPending
        email={email}
        onResendEmail={onResendEmail}
        onBackToLogin={onNavigateToLogin}
        isLoading={isLoading}
      />
    </div>
  );
};