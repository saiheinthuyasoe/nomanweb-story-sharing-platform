'use client';

import React, { useState } from 'react';
import LexicalEditor from '@/components/editor/LexicalEditor';

export default function TestListAlignmentPage() {
  const [content, setContent] = useState('');

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test List Alignment - Enhanced
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <div className="space-y-3 text-gray-700">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">✅ Basic List Alignment</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Create a bullet or numbered list using the toolbar</li>
                <li>Select the list and click center/right alignment</li>
                <li>Verify that both markers and content align properly</li>
              </ol>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ Multi-line Content Test</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Create a list item with multiple lines</li>
                <li>Press Enter within a list item to create paragraphs</li>
                <li>Apply center/right alignment</li>
                <li>Check that spacing remains consistent</li>
              </ol>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">✅ Edge Cases to Test</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Empty list items (should not show blank bullets)</li>
                <li>Nested lists with alignment</li>
                <li>Lists with mixed content (text + paragraphs)</li>
                <li>Lists with line breaks (Shift+Enter)</li>
              </ol>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">✅ Spacing Issues Fixed</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>No more weird spacing with multi-line content</li>
                <li>Proper line height for readability</li>
                <li>Consistent margins between list items</li>
                <li>No blank bullets appearing</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Editor</h2>
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-semibold text-yellow-800 mb-2">Debug Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Create a bullet or numbered list</li>
              <li>Select the list and click center/right alignment</li>
              <li>Open browser console (F12) to see debug logs</li>
              <li>Check if the plugin is detecting the alignment command</li>
            </ol>
          </div>
          <LexicalEditor
            value={content}
            onChange={handleContentChange}
            placeholder="Create lists and test alignment with multi-line content..."
            isDarkMode={false}
            className="min-h-[500px]"
          />
        </div>

        {content && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">Generated HTML</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto max-h-96 overflow-y-auto">
              {content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 