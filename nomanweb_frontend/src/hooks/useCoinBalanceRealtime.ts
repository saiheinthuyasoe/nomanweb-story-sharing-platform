import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Cookies from 'js-cookie';

interface CoinBalanceUpdate {
  type: 'balance_update';
  userId: string;
  newBalance: number;
  timestamp: string;
}

export function useCoinBalanceRealtime() {
  console.log('🎯 useCoinBalanceRealtime hook initialized');
  const { user, updateUser } = useAuth();
  console.log('🔍 AuthContext user:', user);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    console.log('🔄 useCoinBalanceRealtime hook triggered');
    console.log('👤 Current user:', user);
    
    if (!user) {
      console.log('❌ No user found, skipping balance SSE connection');
      return;
    }

    console.log('🔗 Setting up balance SSE connection for user:', user.id);

    const connectToSSE = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) {
          console.log('❌ No token found in cookies, skipping SSE connection');
          return;
        }

        // Cancel existing connection if any
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // Connect to backend SSE endpoint with authentication
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
        const response = await fetch(`${backendUrl}/coins/sse/balance-updates`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          console.error(`❌ SSE connection failed: ${response.status} ${response.statusText}`);
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        console.log('✅ Connected to coin balance updates SSE (Backend)');

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No readable stream available');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('🔌 SSE stream ended');
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
                    console.log('✅ SSE connected:', parsedData);
                  } else if (eventType === 'balance_update') {
                    const update: CoinBalanceUpdate = JSON.parse(data);
                    console.log('📨 Received balance update:', update);
                    console.log('🔍 Current user ID:', user.id, '(type:', typeof user.id, ')');
                    console.log('🔍 Update user ID:', update.userId, '(type:', typeof update.userId, ')');
                    
                    // Only update if this is for the current user
                    if (update.userId === user.id || update.userId === String(user.id)) {
                      console.log('✅ Updating balance for current user from', user.coinBalance, 'to', update.newBalance);
                      
                      // Update user's coin balance in context
                      updateUser({ coinBalance: update.newBalance });
                      
                      // Show a notification
                      console.log(`💰 Balance updated: ${update.newBalance} coins`);
                    } else {
                      console.log('❌ Balance update for different user:', update.userId, 'vs', user.id);
                      console.log('🔍 Comparison results:');
                      console.log('  - update.userId === user.id:', update.userId === user.id);
                      console.log('  - update.userId === String(user.id):', update.userId === String(user.id));
                    }
                  }
                } catch (error) {
                  console.error('❌ Error parsing SSE data:', error);
                }
              }
            }
          }
        }

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('🔄 SSE connection aborted');
        } else {
          console.error('❌ SSE connection error:', error);
          
          // Attempt to reconnect after a delay
          setTimeout(connectToSSE, 5000);
        }
      }
    };

    console.log('🔄 Setting up SSE connection for user:', user.id);
    connectToSSE();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        console.log('🧹 Cleaning up SSE connection');
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [user, updateUser]);

  return null; // This hook doesn't return anything, it just manages the SSE connection
} 