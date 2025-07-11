'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api/auth';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/utils/errorHandling';

export default function VerifyEmailPendingPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [canResend, setCanResend] = useState(true);

  // Cooldown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownTime]);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Email address is required');
      return;
    }

    if (!canResend) {
      toast.error(`Please wait ${cooldownTime} seconds before resending`);
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resendVerification(email);
      toast.success('Verification email sent successfully!');
      
      // Start cooldown timer (60 seconds)
      setCooldownTime(60);
      setCanResend(false);
    } catch (error: any) {
      handleApiError(error, 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Check Your Email
        </h1>
        
        <p className="text-gray-600 mb-6">
          We've sent a verification email to{' '}
          {email && <strong>{email}</strong>}
          {!email && <strong>your email address</strong>}.
          Please click the verification link in the email to activate your account.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Important:</strong> You must verify your email before you can log in to your account.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or
          </p>
          
          <button
            onClick={handleResendVerification}
            disabled={isLoading || !email || !canResend}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : !canResend ? (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Resend in {cooldownTime}s
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Resend Verification Email
              </>
            )}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            href="/login"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </Link>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>
            The verification link will expire in 48 hours.
          </p>
        </div>
      </div>
    </div>
  );
} 