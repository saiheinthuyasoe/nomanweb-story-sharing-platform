'use client'

import { useState, useEffect } from 'react';
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
}

export default function TestRealtimeCoinsPage() {
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [updates, setUpdates] = useState<string[]>([]);

  useEffect(() => {
    // Fetch initial data
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/coins/packages');
        if (response.ok) {
          const packages = await response.json();
          setCoinPackages(packages);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();

    // Set up SSE connection
    const eventSource = new EventSource('/api/sse/coin-packages');

    eventSource.onopen = () => {
      setConnectionStatus('connected');
      console.log('Connected to SSE');
      toast.success('Connected to real-time updates');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const timestamp = new Date().toLocaleTimeString();
        
        switch (data.type) {
          case 'CONNECTED':
            setUpdates(prev => [...prev, `${timestamp}: Connected to server`]);
            break;
          case 'HEARTBEAT':
            setUpdates(prev => [...prev, `${timestamp}: Heartbeat received`]);
            break;
          case 'PACKAGE_UPDATED':
            setCoinPackages(prev => 
              prev.map(pkg => pkg.id === data.package.id ? data.package : pkg)
            );
            setUpdates(prev => [...prev, `${timestamp}: Package updated - ${data.package.name}`]);
            toast.success(`Package updated: ${data.package.name}`);
            break;
          case 'PACKAGE_DELETED':
            setCoinPackages(prev => prev.filter(pkg => pkg.id !== data.packageId));
            setUpdates(prev => [...prev, `${timestamp}: Package deleted - ${data.packageId}`]);
            toast.success('Package deleted');
            break;
          case 'PACKAGE_CREATED':
            setCoinPackages(prev => [...prev, data.package]);
            setUpdates(prev => [...prev, `${timestamp}: Package created - ${data.package.name}`]);
            toast.success(`New package created: ${data.package.name}`);
            break;
          default:
            setUpdates(prev => [...prev, `${timestamp}: Unknown event - ${data.type}`]);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
        setUpdates(prev => [...prev, `${new Date().toLocaleTimeString()}: Error parsing message`]);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setConnectionStatus('disconnected');
      toast.error('Lost connection to real-time updates');
    };

    return () => {
      eventSource.close();
      setConnectionStatus('disconnected');
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Real-time Coin Packages Test</h1>
      
      {/* Connection Status */}
      <div className="mb-6">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          connectionStatus === 'connected' 
            ? 'bg-green-100 text-green-800' 
            : connectionStatus === 'connecting'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            connectionStatus === 'connected' 
              ? 'bg-green-500' 
              : connectionStatus === 'connecting'
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}></div>
          {connectionStatus === 'connected' ? 'Connected' : 
           connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Packages */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Current Packages ({coinPackages.length})</h2>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {coinPackages.map((pkg) => (
              <div key={pkg.id} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{pkg.name}</h3>
                    <p className="text-sm text-gray-600">{pkg.description}</p>
                    <div className="text-sm text-gray-500 mt-2">
                      <span className="font-medium">{pkg.coins} coins</span>
                      {pkg.bonusCoins && pkg.bonusCoins > 0 && (
                        <span className="text-green-600 ml-2">+{pkg.bonusCoins} bonus</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">
                      ฿{pkg.priceThb?.toLocaleString() || 'N/A'}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      pkg.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Updates Log */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Real-time Updates Log</h2>
          
          <div className="bg-gray-50 border rounded-lg p-4 h-96 overflow-y-auto">
            <div className="space-y-2">
              {updates.length === 0 ? (
                <p className="text-gray-500 text-sm">No updates received yet...</p>
              ) : (
                updates.slice(-20).map((update, index) => (
                  <div key={index} className="text-sm font-mono text-gray-700 pb-1 border-b border-gray-200">
                    {update}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <button 
            onClick={() => setUpdates([])}
            className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          >
            Clear Log
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Test Instructions</h3>
        <ol className="list-decimal list-inside text-blue-800 space-y-1">
          <li>Keep this page open</li>
          <li>Open the admin coins page in another tab: <a href="/admin/coins" className="underline" target="_blank">Admin Coins</a></li>
          <li>Create, edit, or delete a coin package in the admin panel</li>
          <li>Watch this page for real-time updates</li>
          <li>The packages list should update automatically without refreshing</li>
        </ol>
      </div>
    </div>
  );
} 