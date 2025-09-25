'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useAuth } from '@/contexts/AuthContext';

export function AuthDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    const token = Cookies.get('token');
    const refreshToken = Cookies.get('refreshToken');
    const allCookies = document.cookie;

    // Try to decode JWT token payload (without verification)
    let tokenPayload = null;
    if (token) {
      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        tokenPayload = {
          sub: decoded.sub,
          exp: decoded.exp,
          iat: decoded.iat,
          expiresAt: new Date(decoded.exp * 1000).toISOString(),
          isExpired: decoded.exp * 1000 < Date.now()
        };
      } catch (e) {
        tokenPayload = { error: 'Failed to decode token' };
      }
    }

    setDebugInfo({
      user,
      loading,
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      tokenPreview: token ? token.substring(0, 30) + '...' : null,
      tokenPayload,
      allCookies,
      timestamp: new Date().toISOString()
    });
  }, [user, loading]);

  if (!debugInfo) return null;

  return (
    <div className="fixed top-4 right-4 bg-gray-900 text-white p-4 rounded-lg max-w-md text-xs font-mono z-50">
      <h3 className="font-bold text-yellow-400 mb-2">🔍 Auth Debug Info</h3>
      
      <div className="space-y-1">
        <div>
          <strong>User:</strong> {debugInfo.user ? 
            `${debugInfo.user.username} (${debugInfo.user.email})` : 
            'Not logged in'
          }
        </div>
        
        <div>
          <strong>Loading:</strong> {debugInfo.loading ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Has Token:</strong> 
          <span className={debugInfo.hasToken ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.hasToken ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div>
          <strong>Has Refresh Token:</strong> 
          <span className={debugInfo.hasRefreshToken ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.hasRefreshToken ? 'Yes' : 'No'}
          </span>
        </div>

        {debugInfo.tokenPayload && (
          <div>
            <strong>Token Status:</strong>
            <div className="ml-2">
              <div>Expires: {debugInfo.tokenPayload.expiresAt?.substring(0, 19)}</div>
              <div>
                <span className={debugInfo.tokenPayload.isExpired ? 'text-red-400' : 'text-green-400'}>
                  {debugInfo.tokenPayload.isExpired ? 'EXPIRED' : 'Valid'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <strong>Cookies:</strong> {debugInfo.allCookies || 'None'}
        </div>
        
        <div className="text-gray-400">
          Updated: {debugInfo.timestamp?.substring(11, 19)}
        </div>
      </div>
      
      <button 
        onClick={() => window.location.reload()} 
        className="mt-2 px-2 py-1 bg-blue-600 rounded text-xs"
      >
        Refresh
      </button>
    </div>
  );
} 