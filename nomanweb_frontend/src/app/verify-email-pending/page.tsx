'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { authApi } from '@/lib/api/auth';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/utils/errorHandling';

function VerifyEmailPendingContent() {
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url(/mountain.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-sm w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-white/30 text-center">
        <Mail className="h-12 w-12 text-white mx-auto mb-3 drop-shadow-lg" />
        
        <h1 className="text-xl font-bold text-white mb-3 drop-shadow-lg">
          Check Your Email
        </h1>
        
        <p className="text-white/80 mb-4 text-sm">
          We've sent a verification email to{' '}
          {email && <strong>{email}</strong>}
          {!email && <strong>your email address</strong>}.
          Please click the verification link in the email to activate your account.
        </p>

        <div className="bg-white/20 border border-white/30 rounded-md p-3 mb-4 backdrop-blur-sm">
          <p className="text-xs text-white">
            <strong>Important:</strong> You must verify your email before you can log in to your account.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-white/70">
            Didn't receive the email? Check your spam folder or
          </p>
          
          <button
            onClick={handleResendVerification}
            disabled={isLoading || !email || !canResend}
            className="inline-flex items-center px-3 py-2 bg-[#20243c] text-white rounded-md hover:bg-[#23274a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

        <div className="mt-6 pt-4 border-t border-white/30">
          <Link
            href="/login"
            className="inline-flex items-center text-white/80 hover:text-white text-xs"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to Login
          </Link>
        </div>

        <div className="mt-3 text-xs text-white/60">
          <p>
            The verification link will expire in 48 hours.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-xl shadow-2xl p-8 text-center border border-white/20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    }>
      <VerifyEmailPendingContent />
    </Suspense>
  );
}