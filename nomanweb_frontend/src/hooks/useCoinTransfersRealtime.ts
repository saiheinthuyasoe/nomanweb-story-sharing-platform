import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface CoinTransfer {
  transferId: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  amount: number;
  transferType: 'transfer' | 'withdraw';
  reason: string;
  newBalance: number;
  balanceBefore: number;
  timestamp: string;
}

interface UseCoinTransfersRealtimeProps {
  onTransferCompleted?: (transfer: CoinTransfer) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const useCoinTransfersRealtime = ({
  onTransferCompleted,
  onConnectionChange,
}: UseCoinTransfersRealtimeProps) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Prevent multiple connections
    if (eventSourceRef.current) {
      console.log('SSE connection already exists, skipping...');
      return;
    }

    const connectSSE = () => {
      try {
        // Close existing connection if any
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        console.log('Creating new SSE connection for coin transfers...');
        eventSourceRef.current = new EventSource('/api/sse/coin-transfers');

        eventSourceRef.current.onopen = () => {
          console.log('✅ Connected to coin transfers SSE');
          onConnectionChange?.(true);
        };

        eventSourceRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'CONNECTED':
                console.log('✅ SSE connection established for coin transfers');
                break;
              case 'HEARTBEAT':
                // Reduce heartbeat logging
                break;
              case 'TRANSFER_COMPLETED':
                console.log('📨 Transfer completed:', data);
                onTransferCompleted?.(data);
                toast.success(`${data.transferType === 'transfer' ? 'Coins transferred' : 'Coins withdrawn'} for ${data.user.username}`);
                break;
              default:
                console.log('Unknown SSE event:', data.type);
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };

        eventSourceRef.current.onerror = (error) => {
          console.error('❌ SSE error:', error);
          onConnectionChange?.(false);
          
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          
          // Only reconnect if not in development mode with hot reloading
          if (process.env.NODE_ENV === 'production') {
            reconnectTimeoutRef.current = setTimeout(() => {
              connectSSE();
            }, 3000);
          }
        };
      } catch (error) {
        console.error('Error setting up SSE connection:', error);
        onConnectionChange?.(false);
        
        // Only retry in production
        if (process.env.NODE_ENV === 'production') {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, 3000);
        }
      }
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up SSE connection...');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      onConnectionChange?.(false);
    };
  }, []);

  return {
    // Return any additional functionality if needed
    disconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      onConnectionChange?.(false);
    }
  };
}; 