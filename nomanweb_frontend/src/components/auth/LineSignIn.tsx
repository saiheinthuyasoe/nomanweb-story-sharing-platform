'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api/auth';
import toast from 'react-hot-toast';

interface LineSignInProps {
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  className?: string;
  children?: React.ReactNode;
}

export default function LineSignIn({ 
  onSuccess, 
  onError, 
  className = '',
  children 
}: LineSignInProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLineSignIn = async () => {
    setIsLoading(true);
    try {
      // LINE OAuth flow - redirect to LINE authorization
      const lineChannelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || '2007499018';
      const redirectUri = process.env.NEXT_PUBLIC_LINE_CALLBACK_URL || 'http://localhost:3000/auth/line/callback';
      const state = Math.random().toString(36).substring(2, 15);
      
      // Store state for verification (use both storage methods for reliability)
      sessionStorage.setItem('line_oauth_state', state);
      localStorage.setItem('line_oauth_state', state);
      
      // Also store timestamp for cleanup
      localStorage.setItem('line_oauth_timestamp', Date.now().toString());
      
      // Construct LINE OAuth URL with proper encoding
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: lineChannelId,
        redirect_uri: redirectUri,
        state: state,
        scope: 'profile openid'
      });

      const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;

      console.log('LINE OAuth URL:', lineAuthUrl);
      console.log('Channel ID:', lineChannelId);
      console.log('Redirect URI:', redirectUri);

      // Redirect to LINE OAuth
      window.location.href = lineAuthUrl;
      
    } catch (error: any) {
      console.error('LINE sign-in failed:', error);
      toast.error('LINE sign-in failed');
      onError?.(error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLineSignIn}
      disabled={isLoading}
      className={`
        flex items-center justify-center w-full px-4 py-2 
        border border-gray-300 rounded-md shadow-sm 
        bg-green-500 text-white hover:bg-green-600 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Signing in...
        </div>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.631.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.628-.629.628M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          {children || 'Continue with LINE'}
        </>
      )}
    </button>
  );
} 