"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestRefundApi() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRefundController = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/refunds/test');
      const data = await response.json();
      setTestResult({ endpoint: '/api/refunds/test', data });
    } catch (error) {
      setTestResult({ endpoint: '/api/refunds/test', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testHasPurchases = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/refunds/stories/f1deac3c-51a6-4003-9638-f31d463aa663/has-purchases');
      const data = await response.json();
      setTestResult({ endpoint: '/api/refunds/stories/{storyId}/has-purchases', data });
    } catch (error) {
      setTestResult({ endpoint: '/api/refunds/stories/{storyId}/has-purchases', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testStoryHasPurchases = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stories/f1deac3c-51a6-4003-9638-f31d463aa663/has-purchases');
      const data = await response.json();
      setTestResult({ endpoint: '/api/stories/{storyId}/has-purchases', data });
    } catch (error) {
      setTestResult({ endpoint: '/api/stories/{storyId}/has-purchases', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testStoryCalculateRefund = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stories/f1deac3c-51a6-4003-9638-f31d463aa663/calculate-refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      setTestResult({ endpoint: '/api/stories/{storyId}/calculate-refund', data });
    } catch (error) {
      setTestResult({ endpoint: '/api/stories/{storyId}/calculate-refund', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testStoryController = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stories/test');
      const data = await response.json();
      setTestResult({ endpoint: '/api/stories/test', data });
    } catch (error) {
      setTestResult({ endpoint: '/api/stories/test', error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Refund API</h1>
      
      <div className="space-y-4">
        <Button 
          onClick={testRefundController} 
          disabled={loading}
          className="mr-4"
        >
          Test Refund Controller
        </Button>
        
        <Button 
          onClick={testHasPurchases} 
          disabled={loading}
          className="mr-4"
        >
          Test Refund Has Purchases
        </Button>

        <Button 
          onClick={testStoryHasPurchases} 
          disabled={loading}
          className="mr-4"
        >
          Test Story Has Purchases
        </Button>

        <Button 
          onClick={testStoryCalculateRefund} 
          disabled={loading}
          className="mr-4"
        >
          Test Story Calculate Refund
        </Button>

        <Button 
          onClick={testStoryController} 
          disabled={loading}
        >
          Test Story Controller
        </Button>
      </div>

      {testResult && (
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Test Result for: {testResult.endpoint}</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(testResult.data || testResult.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 