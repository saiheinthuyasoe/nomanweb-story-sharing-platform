"use client";

import { useAuth } from "@/contexts/AuthContext";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

export default function TestAuthPage() {
  const { user, loading } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<{
    token: string | undefined;
    refreshToken: string | undefined;
  }>({ token: undefined, refreshToken: undefined });

  useEffect(() => {
    const token = Cookies.get('token');
    const refreshToken = Cookies.get('refreshToken');
    setTokenInfo({ token, refreshToken });
  }, []);

  const testVerifySession = async () => {
    try {
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenInfo.token}`,
        },
        body: JSON.stringify({
          sessionId: 'cs_test_a1Kv8zTLxPOsyXd22u1lDxVY7381GtzcuNZKbb4BgNnBkUCdW5j1nSlIpe',
        }),
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
    } catch (error) {
      console.error('Test error:', error);
    }
  };

  if (loading) {
    return <div>Loading auth...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">User State:</h2>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Token Info:</h2>
          <div className="bg-gray-100 p-2 rounded">
            <p><strong>Has Token:</strong> {tokenInfo.token ? 'Yes' : 'No'}</p>
            <p><strong>Has Refresh Token:</strong> {tokenInfo.refreshToken ? 'Yes' : 'No'}</p>
            {tokenInfo.token && (
              <p><strong>Token Preview:</strong> {tokenInfo.token.substring(0, 20)}...</p>
            )}
          </div>
        </div>
        
        <button 
          onClick={testVerifySession}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Verify Session API
        </button>
      </div>
    </div>
  );
}