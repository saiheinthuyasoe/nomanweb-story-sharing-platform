'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface RedisTestResult {
  status?: string;
  message?: string;
  testValue?: string;
  timestamp?: number;
  success?: boolean;
  key?: string;
  originalValue?: string;
  retrievedValue?: string;
  matches?: boolean;
  error?: string;
  redisInfo?: string;
}

export default function TestRedisPage() {
  const [healthResult, setHealthResult] = useState<RedisTestResult | null>(null);
  const [cacheResult, setCacheResult] = useState<RedisTestResult | null>(null);
  const [statsResult, setStatsResult] = useState<RedisTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [testKey, setTestKey] = useState('test:key:123');
  const [testValue, setTestValue] = useState('Hello Redis!');

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

  const testRedisHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/redis/health`);
      const result = await response.json();
      setHealthResult(result);
    } catch (error) {
      setHealthResult({
        status: 'ERROR',
        message: `Failed to connect: ${error}`,
        timestamp: Date.now()
      });
    } finally {
      setLoading(false);
    }
  };

  const testCache = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/redis/test-cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: testKey,
          value: testValue
        })
      });
      const result = await response.json();
      setCacheResult(result);
    } catch (error) {
      setCacheResult({
        success: false,
        error: `Failed to test cache: ${error}`,
        timestamp: Date.now()
      });
    } finally {
      setLoading(false);
    }
  };

  const getCacheStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/redis/cache-stats`);
      const result = await response.json();
      setStatsResult(result);
    } catch (error) {
      setStatsResult({
        success: false,
        error: `Failed to get stats: ${error}`,
        timestamp: Date.now()
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'UP':
        return 'bg-green-100 text-green-800';
      case 'DOWN':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Redis Testing Dashboard</h1>
        <p className="text-gray-600">Test Redis connectivity and caching functionality</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Health Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Health Check
              {healthResult && (
                <Badge className={getStatusColor(healthResult.status || '')}>
                  {healthResult.status || 'UNKNOWN'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Test basic Redis connectivity and functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testRedisHealth} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Redis Health'}
            </Button>
            
            {healthResult && (
              <div className="space-y-2 text-sm">
                <div><strong>Status:</strong> {healthResult.status}</div>
                <div><strong>Message:</strong> {healthResult.message}</div>
                <div><strong>Test Value:</strong> {healthResult.testValue}</div>
                <div><strong>Timestamp:</strong> {formatTimestamp(healthResult.timestamp)}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cache Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💾 Cache Test
              {cacheResult && (
                <Badge className={cacheResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {cacheResult.success ? 'SUCCESS' : 'FAILED'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Test Redis cache read/write operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testKey">Cache Key:</Label>
              <Input
                id="testKey"
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                placeholder="Enter cache key"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="testValue">Cache Value:</Label>
              <Input
                id="testValue"
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                placeholder="Enter cache value"
              />
            </div>

            <Button 
              onClick={testCache} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Cache'}
            </Button>
            
            {cacheResult && (
              <div className="space-y-2 text-sm">
                <div><strong>Success:</strong> {cacheResult.success ? 'Yes' : 'No'}</div>
                {cacheResult.key && <div><strong>Key:</strong> {cacheResult.key}</div>}
                {cacheResult.originalValue && <div><strong>Original Value:</strong> {cacheResult.originalValue}</div>}
                {cacheResult.retrievedValue && <div><strong>Retrieved Value:</strong> {cacheResult.retrievedValue}</div>}
                {cacheResult.matches !== undefined && (
                  <div><strong>Values Match:</strong> {cacheResult.matches ? 'Yes' : 'No'}</div>
                )}
                {cacheResult.error && <div><strong>Error:</strong> {cacheResult.error}</div>}
                <div><strong>Timestamp:</strong> {formatTimestamp(cacheResult.timestamp)}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cache Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Cache Stats
              {statsResult && (
                <Badge className={statsResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {statsResult.success ? 'SUCCESS' : 'FAILED'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Get Redis server information and statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={getCacheStats} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Get Cache Stats'}
            </Button>
            
            {statsResult && (
              <div className="space-y-2 text-sm">
                <div><strong>Success:</strong> {statsResult.success ? 'Yes' : 'No'}</div>
                {statsResult.error && <div><strong>Error:</strong> {statsResult.error}</div>}
                <div><strong>Timestamp:</strong> {formatTimestamp(statsResult.timestamp)}</div>
                {statsResult.redisInfo && (
                  <div className="mt-4">
                    <strong>Redis Info:</strong>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                      {statsResult.redisInfo}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Test Summary</CardTitle>
          <CardDescription>
            Overall Redis functionality status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {healthResult?.status === 'UP' ? '✅' : healthResult?.status === 'DOWN' ? '❌' : '⏳'}
              </div>
              <div className="text-sm text-gray-600">Health Check</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {cacheResult?.success ? '✅' : cacheResult?.success === false ? '❌' : '⏳'}
              </div>
              <div className="text-sm text-gray-600">Cache Operations</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {statsResult?.success ? '✅' : statsResult?.success === false ? '❌' : '⏳'}
              </div>
              <div className="text-sm text-gray-600">Server Stats</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📖 How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">1. Health Check</h4>
            <p className="text-sm text-gray-600">
              Tests basic Redis connectivity by setting and retrieving a test value.
              This verifies that your Redis server is running and accessible.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">2. Cache Test</h4>
            <p className="text-sm text-gray-600">
              Tests Redis cache operations by storing and retrieving custom key-value pairs.
              This verifies that your caching layer is working correctly.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">3. Cache Stats</h4>
            <p className="text-sm text-gray-600">
              Retrieves Redis server information and statistics.
              This provides insights into your Redis server's performance and configuration.
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800">💡 Note</h4>
            <p className="text-sm text-blue-700">
              This frontend page tests Redis through the backend API. The frontend itself doesn't directly use Redis - 
              it communicates with the Spring Boot backend, which handles all Redis operations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 