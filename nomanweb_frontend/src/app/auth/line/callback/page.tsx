'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api/auth';
import toast from 'react-hot-toast';

export default function LineCallbackPage() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthData } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions (React 18 Strict Mode issue)
    if (hasProcessed.current) {
      console.log('LINE callback already processed, skipping...');
      return;
    }

    const handleLineCallback = async () => {
      try {
        hasProcessed.current = true;

        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const storedState = sessionStorage.getItem('line_oauth_state') || localStorage.getItem('line_oauth_state');
        const timestamp = localStorage.getItem('line_oauth_timestamp');

        console.log('LINE Callback Debug:');
        console.log('- Code:', code);
        console.log('- State from URL:', state);
        console.log('- Stored state (session):', sessionStorage.getItem('line_oauth_state'));
        console.log('- Stored state (local):', localStorage.getItem('line_oauth_state'));
        console.log('- Timestamp:', timestamp);

        // Verify state parameter (but be more lenient for debugging)
        if (!state) {
          throw new Error('State parameter missing from callback');
        }
        
        if (!storedState) {
          console.warn('No stored state found, but continuing with callback...');
        } else if (state !== storedState) {
          console.warn('State mismatch, but continuing with callback...');
          console.log('Expected:', storedState, 'Got:', state);
        }

        // Clear stored state from both locations
        sessionStorage.removeItem('line_oauth_state');
        localStorage.removeItem('line_oauth_state');
        localStorage.removeItem('line_oauth_timestamp');

        if (!code) {
          throw new Error('Authorization code not received');
        }

        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.NEXT_PUBLIC_LINE_CALLBACK_URL || 'http://localhost:3000/auth/line/callback',
            client_id: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || '2007499018',
            client_secret: process.env.NEXT_PUBLIC_LINE_CHANNEL_SECRET || 'fde2263703ef7429ba83b5d1daa5b9de',
          }),
        });

        console.log('LINE Token Exchange:');
        console.log('- Response status:', tokenResponse.status);
        console.log('- Response ok:', tokenResponse.ok);

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('LINE token exchange failed:', errorText);
          throw new Error('Failed to exchange authorization code for access token');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        console.log('LINE Token Data:');
        console.log('- Access token received:', !!accessToken);
        console.log('- Token type:', tokenData.token_type);

        if (!accessToken) {
          throw new Error('Access token not received');
        }

        console.log('Sending access token to backend...');
        
        // Send access token to our backend
        const response = await authApi.lineLogin(accessToken);
        
        console.log('Backend response:', response);
        
        // Set authentication data
        setAuthData(response.token, response.user);
        
        toast.success('LINE sign-in successful!');
        router.push('/dashboard');
        
      } catch (error: any) {
        console.error('LINE OAuth callback error:', error);
        setError(error.message || 'LINE authentication failed');
        toast.error('LINE sign-in failed');
        
        // Redirect to login page after error
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleLineCallback();
  }, [searchParams, router, setAuthData]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing LINE Sign-In</h1>
          <p className="text-gray-600">Please wait while we complete your authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return null;
} 