'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';

export default function DebugRefreshTokenPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [logs, setLogs] = useState<string[]>([]);
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const checkLocalTokens = () => {
    const token = Cookies.get('token');
    const refreshToken = Cookies.get('refreshToken');
    
    if (!token || !refreshToken) {
      addLog('❌ No tokens found in cookies');
      return;
    }

    try {
      // Parse access token
      const accessPayload = JSON.parse(atob(token.split('.')[1]));
      const accessExp = new Date(accessPayload.exp * 1000);
      const now = new Date();
      
      // Parse refresh token
      const refreshPayload = JSON.parse(atob(refreshToken.split('.')[1]));
      const refreshExp = new Date(refreshPayload.exp * 1000);
      
      const info = {
        accessToken: {
          expires: accessExp.toLocaleString(),
          isExpired: now > accessExp,
          timeLeft: Math.max(0, accessExp.getTime() - now.getTime()),
          payload: accessPayload
        },
        refreshToken: {
          expires: refreshExp.toLocaleString(),
          isExpired: now > refreshExp,
          timeLeft: Math.max(0, refreshExp.getTime() - now.getTime()),
          payload: refreshPayload
        }
      };
      
      setTokenInfo(info);
      addLog(`✅ Tokens parsed successfully`);
      addLog(`🔑 Access token expires: ${info.accessToken.expires} (${info.accessToken.isExpired ? 'EXPIRED' : 'VALID'})`);
      addLog(`🔄 Refresh token expires: ${info.refreshToken.expires} (${info.refreshToken.isExpired ? 'EXPIRED' : 'VALID'})`);
    } catch (error) {
      addLog(`❌ Error parsing tokens: ${error}`);
    }
  };

  const testApiCall = async () => {
    addLog('📡 Making API call to /test/auth...');
    try {
      const response = await apiClient.get('/test/auth');
      addLog(`✅ API call successful: ${response.status}`);
      addLog(`🎯 Response: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      addLog(`❌ API call failed: ${error.response?.status} - ${error.message}`);
    }
  };

  const manualRefresh = async () => {
    addLog('🔄 Manual refresh token test...');
    try {
      const refreshToken = Cookies.get('refreshToken');
      if (!refreshToken) {
        addLog('❌ No refresh token found');
        return;
      }

      const response = await fetch('http://localhost:8080/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        addLog(`✅ Manual refresh successful`);
        addLog(`🔑 New access token: ${data.token.substring(0, 20)}...`);
        addLog(`🔄 New refresh token: ${data.refreshToken.substring(0, 20)}...`);
      } else {
        const errorData = await response.text();
        addLog(`❌ Manual refresh failed: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      addLog(`❌ Manual refresh error: ${error}`);
    }
  };

  const checkServerTokens = async () => {
    addLog('🔍 Checking tokens on server...');
    try {
      const response = await apiClient.get('/test/tokens');
      const data = response.data as any;
      addLog(`✅ Token check successful`);
      addLog(`📊 Active tokens: ${data.activeTokenCount}`);
      addLog(`📊 Total tokens: ${data.totalTokenCount}`);
      addLog(`👤 User: ${data.userEmail}`);
      data.tokens.forEach((token: any, index: number) => {
        addLog(`🔑 Token ${index + 1}: ${token.token} (Valid: ${token.isValid}, Revoked: ${token.revoked})`);
      });
    } catch (error: any) {
      addLog(`❌ Token check failed: ${error.response?.status} - ${error.message}`);
    }
  };

  const checkReactQueryCache = () => {
    addLog('🔍 Checking React Query cache...');
    try {
      const queries = queryClient.getQueryCache().getAll();
      addLog(`📊 Total cached queries: ${queries.length}`);
      queries.forEach((query: any, index: number) => {
        const isStale = query.isStale();
        const isFetching = query.state.fetchStatus === 'fetching';
        addLog(`📋 Query ${index + 1}: ${query.queryKey.join(' > ')} (Stale: ${isStale}, Fetching: ${isFetching})`);
      });
    } catch (error: any) {
      addLog(`❌ React Query cache check failed: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    addLog('🚀 Debug page loaded');
    checkLocalTokens();
    
    // Auto-refresh token info every 5 seconds
    const interval = setInterval(checkLocalTokens, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Refresh Token Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Token Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Token Information</h2>
            <div className="space-y-4">
              <button
                onClick={checkLocalTokens}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Check Local Tokens
              </button>
              
              {tokenInfo && (
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-gray-100 rounded">
                    <strong>Access Token:</strong>
                    <br />
                    Expires: {tokenInfo.accessToken.expires}
                    <br />
                    Status: {tokenInfo.accessToken.isExpired ? '❌ EXPIRED' : '✅ VALID'}
                    <br />
                    Time Left: {Math.floor(tokenInfo.accessToken.timeLeft / 1000)}s
                  </div>
                  
                  <div className="p-3 bg-gray-100 rounded">
                    <strong>Refresh Token:</strong>
                    <br />
                    Expires: {tokenInfo.refreshToken.expires}
                    <br />
                    Status: {tokenInfo.refreshToken.isExpired ? '❌ EXPIRED' : '✅ VALID'}
                    <br />
                    Time Left: {Math.floor(tokenInfo.refreshToken.timeLeft / 1000)}s
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
            <div className="space-y-4">
              <button
                onClick={testApiCall}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
              >
                Test API Call
              </button>
              
              <button
                onClick={manualRefresh}
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 w-full"
              >
                Manual Refresh Test
              </button>
              
              <button
                onClick={checkServerTokens}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 w-full"
              >
                Check Server Tokens
              </button>
              
              <button
                onClick={checkReactQueryCache}
                className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 w-full"
              >
                Check React Query Cache
              </button>
              
              <button
                onClick={clearLogs}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full"
              >
                Clear Logs
              </button>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="mt-8 bg-black text-green-400 rounded-lg p-4 h-96 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="font-mono text-sm space-y-1">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 