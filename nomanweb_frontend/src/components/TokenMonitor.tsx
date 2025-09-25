'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { authApi } from '@/lib/api/auth';

interface TokenInfo {
  token: string | null;
  refreshToken: string | null;
  isAccessTokenExpired: boolean;
  isRefreshTokenExpired: boolean;
  accessTokenExpiry: Date | null;
  refreshTokenExpiry: Date | null;
  hasValidTokens: boolean;
}

export default function TokenMonitor() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    token: null,
    refreshToken: null,
    isAccessTokenExpired: false,
    isRefreshTokenExpired: false,
    accessTokenExpiry: null,
    refreshTokenExpiry: null,
    hasValidTokens: false,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { checkTokenExpiration, hasValidTokens, clearTokens } = useTokenRefresh();

  const getTokenExpiry = (token: string): Date | null => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      return null;
    }
  };

  const updateTokenInfo = () => {
    const token = Cookies.get('token');
    const refreshToken = Cookies.get('refreshToken');
    
    const info: TokenInfo = {
      token,
      refreshToken,
      isAccessTokenExpired: token ? checkTokenExpiration(token) : false,
      isRefreshTokenExpired: refreshToken ? checkTokenExpiration(refreshToken) : false,
      accessTokenExpiry: token ? getTokenExpiry(token) : null,
      refreshTokenExpiry: refreshToken ? getTokenExpiry(refreshToken) : null,
      hasValidTokens: hasValidTokens(),
    };

    setTokenInfo(info);
  };

  useEffect(() => {
    updateTokenInfo();
    const interval = setInterval(updateTokenInfo, 1000); // Update every second
    return () => clearInterval(interval);
  }, [checkTokenExpiration, hasValidTokens]);

  const handleRefreshToken = async () => {
    if (!tokenInfo.refreshToken) return;
    
    setIsRefreshing(true);
    try {
      const response = await authApi.refreshToken(tokenInfo.refreshToken);
      Cookies.set('token', response.token, { expires: 7, path: '/', secure: true, sameSite: 'strict' });
      Cookies.set('refreshToken', response.refreshToken, { expires: 7, path: '/', secure: true, sameSite: 'strict' });
      updateTokenInfo();
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearTokens = () => {
    clearTokens();
    updateTokenInfo();
  };

  const formatTimeRemaining = (expiry: Date | null): string => {
    if (!expiry) return 'N/A';
    
    const now = new Date();
    const remaining = expiry.getTime() - now.getTime();
    
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  const getStatusColor = (isExpired: boolean, hasToken: boolean): string => {
    if (!hasToken) return 'bg-gray-500';
    if (isExpired) return 'bg-red-500';
    return 'bg-green-500';
  };

  return (
    <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-lg max-w-md text-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Token Monitor</h3>
        <div className="flex gap-2">
          <button
            onClick={handleRefreshToken}
            disabled={isRefreshing || !tokenInfo.refreshToken}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={handleClearTokens}
            className="px-2 py-1 bg-red-500 text-white rounded text-xs"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        {/* Access Token */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(tokenInfo.isAccessTokenExpired, !!tokenInfo.token)}`}></div>
          <span className="text-gray-700 dark:text-gray-300">Access Token:</span>
          <span className="text-xs font-mono">{tokenInfo.token ? '✓' : '✗'}</span>
        </div>
        {tokenInfo.accessTokenExpiry && (
          <div className="ml-5 text-xs text-gray-600 dark:text-gray-400">
            Expires: {formatTimeRemaining(tokenInfo.accessTokenExpiry)}
          </div>
        )}
        
        {/* Refresh Token */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(tokenInfo.isRefreshTokenExpired, !!tokenInfo.refreshToken)}`}></div>
          <span className="text-gray-700 dark:text-gray-300">Refresh Token:</span>
          <span className="text-xs font-mono">{tokenInfo.refreshToken ? '✓' : '✗'}</span>
        </div>
        {tokenInfo.refreshTokenExpiry && (
          <div className="ml-5 text-xs text-gray-600 dark:text-gray-400">
            Expires: {formatTimeRemaining(tokenInfo.refreshTokenExpiry)}
          </div>
        )}
        
        {/* Overall Status */}
        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${tokenInfo.hasValidTokens ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-700 dark:text-gray-300">
              Status: {tokenInfo.hasValidTokens ? 'Valid' : 'Invalid'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 