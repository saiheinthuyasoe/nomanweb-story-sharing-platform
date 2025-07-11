'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Cookies from 'js-cookie';

export default function TestBackendConnectionPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBackendConnection = async () => {
    setLoading(true);
    setResult('Testing backend connection...\n');

    try {
      const token = Cookies.get('token');
      setResult(prev => prev + `Token exists: ${!!token}\n`);

      if (!token) {
        setResult(prev => prev + '❌ No token found in cookies - please log in\n');
        setLoading(false);
        return;
      }

      // Test 1: Check if backend is reachable
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      setResult(prev => prev + `Backend URL: ${backendUrl}\n`);

      try {
        const healthResponse = await fetch(`${backendUrl.replace('/api', '')}/actuator/health`, {
          method: 'GET',
        });
        setResult(prev => prev + `Backend health check: ${healthResponse.status} ${healthResponse.statusText}\n`);
      } catch (error) {
        setResult(prev => prev + `❌ Backend not reachable: ${error}\n`);
        setLoading(false);
        return;
      }

      // Test 2: Test authentication with backend
      try {
        const authResponse = await fetch(`${backendUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        setResult(prev => prev + `Auth test: ${authResponse.status} ${authResponse.statusText}\n`);
        
        if (authResponse.ok) {
          const userData = await authResponse.json();
          setResult(prev => prev + `✅ Authentication working - User ID: ${userData.id}\n`);
        } else {
          setResult(prev => prev + `❌ Authentication failed\n`);
        }
      } catch (error) {
        setResult(prev => prev + `❌ Auth test error: ${error}\n`);
      }

      // Test 3: Test SSE endpoint
      try {
        const sseResponse = await fetch(`${backendUrl}/coins/sse/balance-updates`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
        });
        setResult(prev => prev + `SSE endpoint test: ${sseResponse.status} ${sseResponse.statusText}\n`);
        
        if (sseResponse.ok) {
          setResult(prev => prev + `✅ SSE endpoint is accessible\n`);
          sseResponse.body?.cancel(); // Close the stream
        } else {
          const errorText = await sseResponse.text();
          setResult(prev => prev + `❌ SSE endpoint failed: ${errorText}\n`);
        }
      } catch (error) {
        setResult(prev => prev + `❌ SSE endpoint error: ${error}\n`);
      }

    } catch (error) {
      setResult(prev => prev + `❌ General error: ${error}\n`);
    }

    setLoading(false);
  };

  const testTransfer = async () => {
    if (!user) return;
    
    setLoading(true);
    setResult(prev => prev + '\n--- Testing coin transfer ---\n');

    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        setResult(prev => prev + '❌ No admin token found\n');
        setLoading(false);
        return;
      }

      const transferData = {
        userIdentifier: user.username,
        amount: 10,
        type: 'transfer',
        reason: 'Test transfer from backend connection test'
      };

      const response = await fetch('/api/admin/coins/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      });

      const result = await response.json();
      setResult(prev => prev + `Transfer result: ${JSON.stringify(result, null, 2)}\n`);

    } catch (error) {
      setResult(prev => prev + `❌ Transfer error: ${error}\n`);
    }

    setLoading(false);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Test Backend Connection</h1>
        <p className="text-red-600">Please log in to test backend connection</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Test Backend Connection</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">User Info</h2>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Current Balance:</strong> {user.coinBalance} coins</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={testBackendConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Backend Connection'}
        </button>

        <button
          onClick={testTransfer}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test Transfer (Admin Required)'}
        </button>
      </div>

      <div className="mt-6 p-4 bg-black text-green-400 rounded-lg">
        <h2 className="text-lg font-semibold mb-2 text-white">Test Results</h2>
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {result || 'Click "Test Backend Connection" to start testing...'}
        </pre>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Instructions</h3>
        <ol className="list-decimal list-inside text-yellow-700 space-y-1">
          <li>Click "Test Backend Connection" to check if the backend is working</li>
          <li>If you have admin access, click "Test Transfer" to trigger a balance update</li>
          <li>Go to `/test-balance-updates` page to see if you receive real-time updates</li>
          <li>Check browser console for additional debug information</li>
        </ol>
      </div>
    </div>
  );
} 