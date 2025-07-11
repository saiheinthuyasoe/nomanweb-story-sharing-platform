'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Cookies from 'js-cookie';

export default function TestSimpleBroadcastPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    if (!user) {
      addLog('No user found');
      return;
    }

    addLog(`Setting up SSE connection for user: ${user.id}`);

    const connectToSSE = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) {
          addLog('No token found in cookies');
          return;
        }

        setConnectionStatus('connecting');
        addLog('Connecting to backend SSE...');

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
        const response = await fetch(`${backendUrl}/coins/sse/balance-updates`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          addLog(`SSE connection failed: ${response.status} ${response.statusText}`);
          setConnectionStatus('disconnected');
          return;
        }

        addLog('Connected to coin balance updates SSE');
        setConnectionStatus('connected');

        const reader = response.body?.getReader();
        if (!reader) {
          addLog('No readable stream available');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            addLog('SSE stream ended');
            setConnectionStatus('disconnected');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              const eventType = line.substring(7);
              const dataLine = lines[lines.indexOf(line) + 1];
              
              if (dataLine && dataLine.startsWith('data: ')) {
                const data = dataLine.substring(6);
                
                try {
                  if (eventType === 'connected') {
                    const parsedData = JSON.parse(data);
                    addLog(`SSE connected: ${JSON.stringify(parsedData)}`);
                  } else if (eventType === 'balance_update') {
                    const update = JSON.parse(data);
                    addLog(`Received balance update: ${JSON.stringify(update)}`);
                    addLog(`Current user ID: ${user.id} (type: ${typeof user.id})`);
                    addLog(`Update user ID: ${update.userId} (type: ${typeof update.userId})`);
                    
                    if (update.userId === user.id || update.userId === String(user.id)) {
                      addLog(`Balance update for current user: ${user.coinBalance} -> ${update.newBalance}`);
                    } else {
                      addLog(`Balance update for different user: ${update.userId} vs ${user.id}`);
                    }
                  } else {
                    addLog(`Received unknown event: ${eventType} - ${data}`);
                  }
                } catch (error) {
                  addLog(`Error parsing SSE data: ${error}`);
                }
              }
            }
          }
        }

      } catch (error) {
        addLog(`SSE connection error: ${error}`);
        setConnectionStatus('disconnected');
      }
    };

    connectToSSE();

  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Test Simple Broadcast</h1>
        <p className="text-red-600">Please log in to test broadcast</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Test Simple Broadcast</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">User Info</h2>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Current Balance:</strong> {user.coinBalance} coins</p>
      </div>

      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium">
          <div className="w-2 h-2 rounded-full mr-2"></div>
          {connectionStatus}
        </div>
      </div>

      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">SSE Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p>No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Testing Instructions</h3>
        <ol className="list-decimal list-inside text-yellow-700 space-y-1">
          <li>Keep this page open</li>
          <li>Go to admin panel in another tab</li>
          <li>Navigate to Admin → Coins → Coin Transfer</li>
          <li>Transfer coins to your user account</li>
          <li>Watch the logs above to see if you receive any events</li>
          <li>Check if you see "balance_update" events</li>
        </ol>
      </div>
    </div>
  );
} 