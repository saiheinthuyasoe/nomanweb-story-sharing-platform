'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import Cookies from 'js-cookie';

export default function TestOAuthPage() {
  const { user, loading } = useAuth();
  const [cookies, setCookies] = useState<{ [key: string]: string }>({});

  const checkCookies = () => {
    const token = Cookies.get('token');
    const refreshToken = Cookies.get('refreshToken');
    setCookies({
      token: token || 'not found',
      refreshToken: refreshToken || 'not found'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">OAuth Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                </div>
              )}
            </div>
          </div>

          {/* Cookies */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Cookies</h2>
            <button 
              onClick={checkCookies}
              className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Check Cookies
            </button>
            <div className="space-y-2">
              <p><strong>Token:</strong> {cookies.token}</p>
              <p><strong>Refresh Token:</strong> {cookies.refreshToken}</p>
            </div>
          </div>

          {/* OAuth Links */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">OAuth Testing</h2>
            <div className="space-y-4">
              <a 
                href="/login" 
                className="block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-center"
              >
                Go to Login Page
              </a>
              <a 
                href="/dashboard" 
                className="block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-center"
              >
                Go to Dashboard
              </a>
            </div>
          </div>

          {/* Debug Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
              <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL}</p>
              <p><strong>Firebase Config:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Present' : 'Missing'}</p>
              <p><strong>LINE Config:</strong> {process.env.NEXT_PUBLIC_LINE_CHANNEL_ID ? 'Present' : 'Missing'}</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">How to Test OAuth:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Go to Login Page"</li>
            <li>Try Google or LINE OAuth</li>
            <li>Check the browser console for debug logs</li>
            <li>Return to this page and click "Check Cookies"</li>
            <li>Try "Go to Dashboard" to see if navigation works</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 