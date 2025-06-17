'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      await authApi.verifyEmail(verificationToken);
      setStatus('success');
      setMessage('Your email has been verified successfully!');
      toast.success('Email verified successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Failed to verify email');
      toast.error('Email verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying Email
              </h1>
              <p className="text-gray-600">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email Verified!
              </h1>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                You will be redirected to login in a few seconds...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center">
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h1>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Link
                  href="/resend-verification"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </Link>
                <div>
                  <Link
                    href="/login"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {status === 'success' && (
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Continue to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 