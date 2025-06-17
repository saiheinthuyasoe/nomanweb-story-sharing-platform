'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import toast from 'react-hot-toast';

interface ResendForm {
  email: string;
}

export default function ResendVerificationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ResendForm>();

  const onSubmit = async (data: ResendForm) => {
    setIsLoading(true);
    try {
      await authApi.resendVerification();
      setEmailSent(true);
      toast.success('Verification email sent successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Verification Email Sent!
          </h1>
          <p className="text-gray-600 mb-6">
            We've sent a new verification email to <strong>{getValues('email')}</strong>.
            Please check your inbox and click the verification link.
          </p>
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </Link>
            <button
              onClick={() => setEmailSent(false)}
              className="w-full text-blue-600 hover:text-blue-800 text-sm"
            >
              Send to different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Resend Verification Email
          </h1>
          <p className="text-gray-600">
            Enter your email address and we'll send you a new verification link.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </div>
            ) : (
              'Send Verification Email'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </Link>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Already verified your email?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 