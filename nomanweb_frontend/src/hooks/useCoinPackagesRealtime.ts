'use client'

import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins?: number;
  totalCoins: number;
  price: number;
  priceThb: number;
  currency: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface UseCoinPackagesRealtimeProps {
  onPackageUpdate?: (updatedPackage: CoinPackage) => void;
  onPackageDelete?: (packageId: string) => void;
  onPackageCreate?: (newPackage: CoinPackage) => void;
  onRefresh?: () => void;
}

export const useCoinPackagesRealtime = ({
  onPackageUpdate,
  onPackageDelete,
  onPackageCreate,
  onRefresh,
}: UseCoinPackagesRealtimeProps) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    const connectSSE = () => {
      try {
        eventSourceRef.current = new EventSource('/api/sse/coin-packages');

        eventSourceRef.current.onopen = () => {
          console.log('Connected to coin packages SSE');
        };

        eventSourceRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'PACKAGE_UPDATED':
                onPackageUpdate?.(data.package);
                toast.success(`Coin package "${data.package.name}" has been updated`);
                break;
              case 'PACKAGE_DELETED':
                onPackageDelete?.(data.packageId);
                toast.success(`Coin package has been removed`);
                break;
              case 'PACKAGE_CREATED':
                onPackageCreate?.(data.package);
                toast.success(`New coin package "${data.package.name}" has been added`);
                break;
              case 'PACKAGES_REFRESH':
                onRefresh?.();
                break;
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };

        eventSourceRef.current.onerror = (error) => {
          console.error('SSE error:', error);
          eventSourceRef.current?.close();
          
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, 3000);
        };
      } catch (error) {
        console.error('Failed to connect to SSE:', error);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSSE();
        }, 3000);
      }
    };

    connectSSE();

    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [onPackageUpdate, onPackageDelete, onPackageCreate, onRefresh]);

  return {
    disconnect: () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    },
  };
}; 