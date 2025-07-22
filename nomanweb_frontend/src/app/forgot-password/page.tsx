'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useForgotPassword } from '@/hooks/useApi';
import toast from 'react-hot-toast';
import { handleApiError } from '@/lib/utils/errorHandling';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>();

  const forgotPasswordMutation = useForgotPassword({
    onSuccess: () => {
      setIsSuccess(true);
      toast.success('Password reset email sent! Please check your inbox.');
    },
    onError: (error: any) => {
      console.error('Forgot password error:', error);
      handleApiError(error, 'Failed to send password reset email. Please try again.');
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data.email);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: 'url(/mountain.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-white/80 mb-6">
              We've sent a password reset link to <strong>{getValues('email')}</strong>
            </p>
            <p className="text-sm text-white/60 mb-6">
              The link will expire in 24 hours. If you don't see the email, please check your spam folder.
            </p>
            <div className="space-y-3">
              <Link
                href="/login"
                className="w-full inline-flex justify-center items-center py-4 px-4 border border-white/30 rounded-xl shadow-lg text-base font-semibold text-white bg-[#20243c] hover:bg-[#23274a] focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 hover:shadow-xl"
              >
                Back to Login
              </Link>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  forgotPasswordMutation.reset();
                }}
                className="w-full inline-flex justify-center items-center py-4 px-4 border border-white/30 rounded-xl shadow-lg text-base font-semibold text-white bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 hover:shadow-xl"
              >
                Send Another Email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/mountain.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-8">
        <div className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-white/80 hover:text-white mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </Link>
          <h2 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">Forgot Password?</h2>
          <p className="text-white/80 text-lg">
            No worries! Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Please enter a valid email address',
                  },
                })}
                type="email"
                className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:border-white/60 focus:bg-white/30 transition-all duration-300 placeholder-white/60 text-white"
                placeholder="Enter your email address"
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-300 drop-shadow-sm">{errors.email.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={forgotPasswordMutation.isPending}
            className="w-full flex justify-center py-4 px-4 border border-white/30 rounded-xl shadow-lg text-base font-semibold text-white bg-[#20243c] hover:bg-[#23274a] focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl"
          >
            {forgotPasswordMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Sending Email...
              </div>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-white/80">
            Remember your password?{' '}
            <Link href="/login" className="font-medium text-white hover:text-white/80 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 