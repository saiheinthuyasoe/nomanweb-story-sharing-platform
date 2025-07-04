'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function TestReactQueryPage() {
  const { user } = useAuth();
  const [refreshCount, setRefreshCount] = useState(0);

  // Test query that requires authentication
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['test-auth-data', refreshCount],
    queryFn: async () => {
      console.log('🔍 Fetching authenticated data...');
      const response = await apiClient.get('/test/auth');
      return response.data;
    },
    staleTime: 0, // Always consider stale
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false; // Don't retry auth errors
      }
      return failureCount < 2;
    },
  });

  const handleManualRefresh = () => {
    setRefreshCount(prev => prev + 1);
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 React Query Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p><strong>User:</strong> {user?.email || 'Not logged in'}</p>
            <p><strong>Refresh Count:</strong> {refreshCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Data</h2>
          <div className="space-y-4">
            <button
              onClick={handleManualRefresh}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Manual Refresh
            </button>
            
            {isLoading && <p>⏳ Loading...</p>}
            {error && (
              <div className="p-4 bg-red-100 border border-red-400 rounded">
                <p className="text-red-700">❌ Error: {error.message}</p>
                <p className="text-sm text-red-600">
                  Status: {error.response?.status} - {error.response?.statusText}
                </p>
              </div>
            )}
            {data && (
              <div className="p-4 bg-green-100 border border-green-400 rounded">
                <p className="text-green-700">✅ Success!</p>
                <pre className="text-sm mt-2">{JSON.stringify(data, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="space-y-2 text-sm">
            <p>1. Access tokens now last 1 day (24 hours)</p>
            <p>2. Refresh tokens last 7 days</p>
            <p>3. Click "Manual Refresh" to test API calls</p>
            <p>4. Navigate between pages to test caching</p>
            <p>5. Check the debug page to see token status</p>
          </div>
        </div>
      </div>
    </div>
  );
} 