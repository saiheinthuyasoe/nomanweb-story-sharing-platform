'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

interface CoinPackagesContextType {
  coinPackages: CoinPackage[];
  loading: boolean;
  error: string | null;
  refreshPackages: () => Promise<void>;
  updatePackageInContext: (updatedPackage: CoinPackage) => void;
  removePackageFromContext: (packageId: string) => void;
  addPackageToContext: (newPackage: CoinPackage) => void;
}

const CoinPackagesContext = createContext<CoinPackagesContextType | undefined>(undefined);

export const useCoinPackages = () => {
  const context = useContext(CoinPackagesContext);
  if (!context) {
    throw new Error('useCoinPackages must be used within a CoinPackagesProvider');
  }
  return context;
};

interface CoinPackagesProviderProps {
  children: ReactNode;
}

export const CoinPackagesProvider: React.FC<CoinPackagesProviderProps> = ({ children }) => {
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoinPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/coins/packages');
      
      if (!response.ok) {
        throw new Error('Failed to fetch coin packages');
      }
      
      const packages = await response.json();
      setCoinPackages(packages);
    } catch (error) {
      console.error('Error fetching coin packages:', error);
      setError('Failed to load coin packages');
    } finally {
      setLoading(false);
    }
  };

  const refreshPackages = async () => {
    await fetchCoinPackages();
  };

  const updatePackageInContext = (updatedPackage: CoinPackage) => {
    setCoinPackages(prev => 
      prev.map(pkg => pkg.id === updatedPackage.id ? updatedPackage : pkg)
    );
  };

  const removePackageFromContext = (packageId: string) => {
    setCoinPackages(prev => prev.filter(pkg => pkg.id !== packageId));
  };

  const addPackageToContext = (newPackage: CoinPackage) => {
    setCoinPackages(prev => [...prev, newPackage]);
  };

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    // Only connect if we're in the browser
    if (typeof window === 'undefined') return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws/coin-packages`;
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('Connected to coin packages WebSocket');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'PACKAGE_UPDATED':
                updatePackageInContext(data.package);
                toast.success(`Coin package "${data.package.name}" has been updated`);
                break;
              case 'PACKAGE_DELETED':
                removePackageFromContext(data.packageId);
                toast.success(`Coin package has been removed`);
                break;
              case 'PACKAGE_CREATED':
                addPackageToContext(data.package);
                toast.success(`New coin package "${data.package.name}" has been added`);
                break;
              case 'PACKAGES_REFRESH':
                refreshPackages();
                break;
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed, attempting to reconnect...');
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    // Initial fetch
    fetchCoinPackages();

    // Connect to WebSocket
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const value: CoinPackagesContextType = {
    coinPackages,
    loading,
    error,
    refreshPackages,
    updatePackageInContext,
    removePackageFromContext,
    addPackageToContext,
  };

  return (
    <CoinPackagesContext.Provider value={value}>
      {children}
    </CoinPackagesContext.Provider>
  );
}; 