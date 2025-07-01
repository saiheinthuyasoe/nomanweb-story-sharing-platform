'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function TestSSEPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const addMessage = (message: string) => {
      setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const connectToSSE = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          addMessage('No token found');
          return;
        }

        addMessage('Connecting to SSE...');

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const response = await fetch(`${backendUrl}/api/coins/sse/balance-updates`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          addMessage(`Connection failed: ${response.status}`);
          return;
        }

        addMessage('✅ Connected to SSE');
        setIsConnected(true);

        const reader = response.body?.getReader();
        if (!reader) {
          addMessage('No readable stream available');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            addMessage('🔌 Stream ended');
            setIsConnected(false);
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
                addMessage(`📨 Event: ${eventType}, Data: ${data}`);
              }
            }
          }
        }

      } catch (error) {
        addMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsConnected(false);
      }
    };

    connectToSSE();
  }, [user]);

  const triggerBalanceUpdate = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/coins/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userIdentifier: user.username,
          amount: 10,
          type: 'transfer',
          reason: 'Test balance update'
        }),
      });

      const result = await response.json();
      if (response.ok) {
        addMessage(`✅ Test transfer successful: ${result.newBalance} coins`);
      } else {
        addMessage(`❌ Test transfer failed: ${result.error}`);
      }
    } catch (error) {
      addMessage(`❌ Test transfer error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">SSE Connection Test</h1>
      
      <div className="mb-4">
        <div className={`inline-block px-3 py-1 rounded-full text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto">
        <h2 className="font-semibold mb-2">Messages:</h2>
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet...</p>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => (
              <div key={index} className="text-sm font-mono">
                {message}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-600">
          User ID: {user?.id || 'Not logged in'}
        </p>
        <p className="text-sm text-gray-600">
          Current Balance: {user?.coinBalance || 0} coins
        </p>
      </div>

      <div className="mt-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
          onClick={triggerBalanceUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Trigger Balance Update'}
        </button>
      </div>
    </div>
  );
} 