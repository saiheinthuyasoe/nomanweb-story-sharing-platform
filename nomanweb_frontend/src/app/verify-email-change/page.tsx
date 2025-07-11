'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import toast from 'react-hot-toast';

export default function VerifyEmailChangePage() {
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

    verifyEmailChange(token);
  }, [token]);

  const verifyEmailChange = async (verificationToken: string) => {
    try {
      await authApi.verifyEmailChange(verificationToken);
      setStatus('success');
      setMessage('Your email address has been changed successfully!');
      toast.success('Email changed successfully!');
      
      // Redirect to profile after 3 seconds
      setTimeout(() => {
        router.push('/profile?emailChanged=true');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Failed to verify email change');
      toast.error('Email change verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Email Change
            </h1>
            <p className="text-gray-600">
              Please wait while we verify your email change request...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Changed Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>Success:</strong> Your email address has been updated. You'll receive a notification at your old email address.
              </p>
            </div>
            <div className="space-y-3">
              <Link
                href="/profile"
                className="w-full inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Profile
              </Link>
              <Link
                href="/dashboard"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
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
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> The verification link may be invalid, expired, or already used.
              </p>
            </div>
            <div className="space-y-3">
              <Link
                href="/profile"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Mail className="h-4 w-4 mr-2" />
                Try Changing Email Again
              </Link>
              <div>
                <Link
                  href="/dashboard"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 