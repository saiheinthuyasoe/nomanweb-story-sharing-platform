'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import LineSignIn from '@/components/auth/LineSignIn';
import toast from 'react-hot-toast';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, setAuthData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: {
      rememberMe: false
    }
  });

  // Load saved email if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setValue('email', savedEmail);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  // Show success message if coming from email verification - moved to useEffect
  useEffect(() => {
    if (verified === 'true') {
      toast.success('Email verified successfully! You can now log in.');
    }
  }, [verified]);

  const onSubmit = async (data: LoginForm) => {
    try {
      // Handle remember me functionality
      if (data.rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      await login(data.email, data.password);
    } catch (error) {
      // Error handling is done in the AuthContext
    }
  };

  const handleGoogleSuccess = (response: any) => {
    // Google OAuth success - need to set token and user in AuthContext
    if (response.token && response.user) {
      // Set token and user in AuthContext
      setAuthData(response.token, response.user);
      
      toast.success('Google login successful!');
      router.push('/dashboard');
    } else {
      toast.error('Google login failed - invalid response');
    }
  };

  const handleGoogleError = (error: any) => {
    console.error('Google OAuth error:', error);
  };

  const handleLineSuccess = (response: any) => {
    // LINE OAuth success - need to set token and user in AuthContext
    if (response.token && response.user) {
      // Set token and user in AuthContext
      setAuthData(response.token, response.user);
      
      toast.success('LINE login successful!');
      router.push('/dashboard');
    } else {
      toast.error('LINE login failed - invalid response');
    }
  };

  const handleLineError = (error: any) => {
    console.error('LINE OAuth error:', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-xl shadow-xl p-6 border border-purple-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your NoManWeb account</p>
        </div>

        {/* OAuth Sign-In */}
        <div className="mb-5 space-y-3">
          <GoogleSignIn 
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
          <LineSignIn 
            onSuccess={handleLineSuccess}
            onError={handleLineError}
          />
        </div>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-purple-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-purple-600">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5" />
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                className="w-full pl-10 pr-3 py-3 bg-transparent border-0 border-b border-gray-300 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-400"
                placeholder="Email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5" />
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-10 py-3 bg-transparent border-0 border-b border-gray-300 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-400"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-purple-600 hover:text-purple-500 transition-colors">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 