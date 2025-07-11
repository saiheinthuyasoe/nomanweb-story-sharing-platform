'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIncrementStoryView } from '@/hooks/useStories';
import { toast } from 'react-hot-toast';

export default function TestViewTrackingPage() {
  const { user } = useAuth();
  const { mutate: incrementStoryView, isPending } = useIncrementStoryView();
  const [storyId, setStoryId] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testStoryView = () => {
    if (!storyId) {
      toast.error('Please enter a story ID');
      return;
    }

    addResult(`Testing story view tracking for story: ${storyId}`);
    addResult(`User: ${user ? user.username : 'Anonymous'}`);
    
    incrementStoryView(storyId, {
      onSuccess: () => {
        addResult('✅ Story view tracked successfully');
        toast.success('Story view tracked successfully');
      },
      onError: (error: any) => {
        addResult(`❌ Failed to track story view: ${error.message}`);
        toast.error('Failed to track story view');
      }
    });
  };

  const testMultipleViews = () => {
    if (!storyId) {
      toast.error('Please enter a story ID');
      return;
    }

    addResult('Testing multiple rapid views (should be blocked by cooldown)...');
    
    // Try to track view multiple times rapidly
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        incrementStoryView(storyId, {
          onSuccess: () => {
            addResult(`✅ View ${i + 1} tracked successfully`);
          },
          onError: (error: any) => {
            addResult(`❌ View ${i + 1} failed: ${error.message}`);
          }
        });
      }, i * 1000); // 1 second apart
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            View Tracking Test Page
          </h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Current User</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              {user ? (
                <div>
                  <p><strong>Username:</strong> {user.username}</p>
                  <p><strong>User ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                </div>
              ) : (
                <p className="text-gray-600">Not logged in (Anonymous user)</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="storyId" className="block text-sm font-medium text-gray-700 mb-2">
                  Story ID to Test
                </label>
                <input
                  type="text"
                  id="storyId"
                  value={storyId}
                  onChange={(e) => setStoryId(e.target.value)}
                  placeholder="Enter a valid story ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={testStoryView}
                  disabled={isPending || !storyId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Tracking...' : 'Test Single View'}
                </button>

                <button
                  onClick={testMultipleViews}
                  disabled={isPending || !storyId}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test Multiple Views
                </button>

                <button
                  onClick={clearResults}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Clear Results
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-600">No test results yet. Run a test to see results here.</p>
              ) : (
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">How to Test</h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">View Tracking Behavior:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>First View:</strong> Should increment the view count</li>
                <li><strong>Subsequent Views (within 24h):</strong> Should be blocked by cooldown</li>
                <li><strong>Author Views:</strong> Should not count as views</li>
                <li><strong>Anonymous Users:</strong> Views are counted but not tracked individually</li>
              </ul>
              
              <h3 className="font-semibold mt-4 mb-2">Expected Results:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>First test should show "View tracked successfully"</li>
                <li>Multiple rapid tests should show some failures due to cooldown</li>
                <li>Check the story's view count in the main application</li>
                <li>Wait 24 hours and test again to see cooldown reset</li>
              </ul>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Backend Status</h2>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> This test requires the backend view tracking system to be properly set up.
                Make sure you have:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Run the database migration (view_tracking_tables.sql)</li>
                <li>Deployed the updated backend with ViewTrackingService</li>
                <li>Triggered the migration endpoint: POST /api/admin/migrate-views</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 