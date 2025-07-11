'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function TestBalanceBroadcastPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBalanceBroadcast = async () => {
    if (!user) return;
    
    setLoading(true);
    setResult('Testing balance broadcast...\n');

    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        setResult(prev => prev + '❌ No admin token found\n');
        setLoading(false);
        return;
      }

      setResult(prev => prev + `🔍 Testing balance broadcast for user: ${user.username} (${user.id})\n`);

      const transferData = {
        userIdentifier: user.username,
        amount: 50,
        type: 'transfer',
        reason: 'Test balance broadcast - manual trigger'
      };

      setResult(prev => prev + '📤 Sending transfer request...\n');

      const response = await fetch('/api/admin/coins/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData),
      });

      const result = await response.json();
      setResult(prev => prev + `📥 Transfer response: ${JSON.stringify(result, null, 2)}\n`);

      if (result.success) {
        setResult(prev => prev + '✅ Transfer successful! Check if balance update was received...\n');
        setResult(prev => prev + '🔍 Look for balance_update events in the browser console\n');
      } else {
        setResult(prev => prev + `❌ Transfer failed: ${result.error}\n`);
      }

    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error}\n`);
    }

    setLoading(false);
  };

  const checkBackendLogs = () => {
    setResult(prev => prev + '\n📋 Backend Logs to Check:\n');
    setResult(prev => prev + '1. Look for: "Broadcasted balance update to user: [user-id]"\n');
    setResult(prev => prev + '2. Look for: "User [user-id] subscribed to coin balance updates"\n');
    setResult(prev => prev + '3. Check if the user ID in logs matches: ' + user?.id + '\n');
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Test Balance Broadcast</h1>
        <p className="text-red-600">Please log in to test balance broadcast</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Test Balance Broadcast</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">User Info</h2>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Current Balance:</strong> {user.coinBalance} coins</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={testBalanceBroadcast}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Balance Broadcast (Admin Required)'}
        </button>

        <button
          onClick={checkBackendLogs}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 ml-4"
        >
          Show Backend Logs to Check
        </button>
      </div>

      <div className="mt-6 p-4 bg-black text-green-400 rounded-lg">
        <h2 className="text-lg font-semibold mb-2 text-white">Test Results</h2>
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {result || 'Click "Test Balance Broadcast" to start testing...'}
        </pre>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Instructions</h3>
        <ol className="list-decimal list-inside text-yellow-700 space-y-1">
          <li>Keep this page open</li>
          <li>Open browser developer tools (F12)</li>
          <li>Go to Console tab</li>
          <li>Click "Test Balance Broadcast"</li>
          <li>Watch for balance_update events in console</li>
          <li>Check backend logs for broadcast messages</li>
        </ol>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Expected Console Logs</h3>
        <div className="text-blue-700 text-sm space-y-1">
          <p>✅ If working: "📨 Received balance update: {...}"</p>
          <p>✅ If working: "✅ Updating balance for current user from X to Y"</p>
          <p>❌ If not working: "❌ Balance update for different user: ..."</p>
        </div>
      </div>
    </div>
  );
} 