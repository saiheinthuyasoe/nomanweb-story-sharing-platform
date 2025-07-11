'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api/auth';
import { storiesApi } from '@/lib/api/stories';

export default function DebugAuthPage() {
  const { user, loading } = useAuth();
  const [cookies, setCookies] = useState<{ [key: string]: string }>({});
  const [allCookies, setAllCookies] = useState<string>('');
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [apiTestResult, setApiTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Get all cookies
    setAllCookies(document.cookie);
    
    // Get specific auth cookies
    const token = Cookies.get('token');
    const refreshToken = Cookies.get('refreshToken');
    setCookies({
      token: token || 'not found',
      refreshToken: refreshToken || 'not found'
    });

    // Decode token if present
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setTokenInfo({
          userId: payload.sub,
          email: payload.email,
          role: payload.role,
          issuedAt: new Date(payload.iat * 1000).toLocaleString(),
          expiresAt: new Date(payload.exp * 1000).toLocaleString(),
          isExpired: new Date() > new Date(payload.exp * 1000),
          timeUntilExpiry: Math.floor((payload.exp * 1000 - Date.now()) / 1000 / 60) + ' minutes'
        });
      } catch (error) {
        setTokenInfo({ error: 'Failed to decode token' });
      }
    }
  }, []);

  const clearAllCookies = () => {
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    setCookies({
      token: 'not found',
      refreshToken: 'not found'
    });
    setAllCookies(document.cookie);
    setTokenInfo(null);
  };

  const testProfileApi = async () => {
    setIsTesting(true);
    setApiTestResult('Testing profile API...');
    
    try {
      const result = await authApi.getProfile();
      setApiTestResult(`✅ Profile API Success: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      setApiTestResult(`❌ Profile API Failed: ${error.message}\n${error.response?.data ? JSON.stringify(error.response.data, null, 2) : ''}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testCreateStoryApi = async () => {
    setIsTesting(true);
    setApiTestResult('Testing create story API...');
    
    try {
      const testStory = {
        title: 'Test Story - ' + new Date().toISOString(),
        description: 'This is a test story created for debugging purposes',
        pricingType: 'FREE' as const,
        bookStatus: 'ONGOING' as const
      };
      
      const result = await storiesApi.createStory(testStory);
      setApiTestResult(`✅ Create Story API Success: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      setApiTestResult(`❌ Create Story API Failed: ${error.message}\n${error.response?.data ? JSON.stringify(error.response.data, null, 2) : ''}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testMyStoriesApi = async () => {
    setIsTesting(true);
    setApiTestResult('Testing my stories API...');
    
    try {
      const result = await storiesApi.getMyStories();
      setApiTestResult(`✅ My Stories API Success: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      setApiTestResult(`❌ My Stories API Failed: ${error.message}\n${error.response?.data ? JSON.stringify(error.response.data, null, 2) : ''}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testDebugUserApi = async () => {
    setIsTesting(true);
    setApiTestResult('Testing debug user API...');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/auth/debug-user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiTestResult(`✅ Debug User API Success: ${JSON.stringify(data, null, 2)}`);
      } else {
        const errorData = await response.text();
        setApiTestResult(`❌ Debug User API Failed: ${response.status} - ${errorData}`);
      }
    } catch (error: any) {
      setApiTestResult(`❌ Debug User API Error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Page</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Auth State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Authentication State</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? 'Present' : 'Not found'}</p>
              {user && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Username:</strong> {user.username}</p>
                  <p><strong>Display Name:</strong> {user.displayName || 'Not set'}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                  <p><strong>Status:</strong> {user.status}</p>
                  <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Cookies */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cookies</h2>
            <div className="space-y-2">
              <p><strong>Token:</strong> {cookies.token}</p>
              <p><strong>Refresh Token:</strong> {cookies.refreshToken}</p>
              <button
                onClick={clearAllCookies}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Clear All Auth Cookies
              </button>
            </div>
          </div>

          {/* Token Info */}
          {tokenInfo && (
            <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Token Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>User ID:</strong> {tokenInfo.userId}</p>
                  <p><strong>Email:</strong> {tokenInfo.email}</p>
                  <p><strong>Role:</strong> {tokenInfo.role}</p>
                </div>
                <div>
                  <p><strong>Issued At:</strong> {tokenInfo.issuedAt}</p>
                  <p><strong>Expires At:</strong> {tokenInfo.expiresAt}</p>
                  <p><strong>Is Expired:</strong> {tokenInfo.isExpired ? 'Yes' : 'No'}</p>
                  <p><strong>Time Until Expiry:</strong> {tokenInfo.timeUntilExpiry}</p>
                </div>
              </div>
            </div>
          )}

          {/* API Tests */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">API Tests</h2>
            <div className="space-x-4 mb-4">
              <button
                onClick={testProfileApi}
                disabled={isTesting}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Test Profile API
              </button>
              <button
                onClick={testMyStoriesApi}
                disabled={isTesting}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                Test My Stories API
              </button>
              <button
                onClick={testCreateStoryApi}
                disabled={isTesting}
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
              >
                Test Create Story API
              </button>
              <button
                onClick={testDebugUserApi}
                disabled={isTesting}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
              >
                Test Debug User API
              </button>
            </div>
            {apiTestResult && (
              <div className="bg-gray-100 p-4 rounded text-sm font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                {apiTestResult}
              </div>
            )}
          </div>

          {/* All Cookies */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">All Cookies</h2>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono break-all">
              {allCookies || 'No cookies found'}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-x-4">
              <a
                href="/login"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block"
              >
                Go to Login
              </a>
              <a
                href="/register"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block"
              >
                Go to Register
              </a>
              <a
                href="/dashboard"
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 inline-block"
              >
                Go to Dashboard
              </a>
              <a
                href="/stories/create"
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 inline-block"
              >
                Try Create Story
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 