'use client';

import React, { useState } from 'react';
import { LiveblocksRoomProvider } from '@/components/collaboration/LiveblocksRoomProvider';
import { LiveblocksActiveCollaborators } from '@/components/collaboration/LiveblocksActiveCollaborators';
import { useLiveblocksCollaboration } from '@/hooks/useLiveblocksCollaboration';
import { useCursorPosition } from '@/hooks/useCursorPosition';

// Test component inside the Liveblocks room
function LiveblocksTest() {
  const { 
    isConnected, 
    collaborators, 
    sendContentUpdate, 
    sendCursorPosition,
    storage 
  } = useLiveblocksCollaboration('test-chapter-123');

  // Get content directly from Liveblocks storage, not local state
  const content = storage?.content || '';
  const [lastTypingTime, setLastTypingTime] = useState(Date.now());
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { textareaRef, cursorPosition, updateCursorPosition, calculateCursorPosition } = useCursorPosition();

  const testLiveblocksConfig = async () => {
    try {
      const response = await fetch('/api/debug-liveblocks');
      const data = await response.json();
      setDebugInfo(data);
      console.log('Liveblocks Debug Info:', data);
    } catch (error) {
      console.error('Failed to fetch debug info:', error);
      setDebugInfo({ error: 'Failed to fetch debug info' });
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    
    // Send real-time update through Liveblocks
    if (sendContentUpdate) {
      sendContentUpdate(newContent, 0, newContent.length, 'replace');
    }
    
    setLastTypingTime(Date.now());
  };

  const handleCursorMove = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const cursorPosition = e.target.selectionStart;
    
    // Update local cursor position for accurate calculation
    updateCursorPosition(content, cursorPosition);
    
    if (sendCursorPosition) {
      sendCursorPosition(cursorPosition);
    }
  };

  // Calculate remote cursor positions
  const remoteCursors = collaborators
    .filter(collaborator => collaborator.cursorPosition !== undefined)
    .map(collaborator => {
      const remotePosition = calculateCursorPosition(content, collaborator.cursorPosition!);
      
      if (!textareaRef.current) return null;
      
      const textareaRect = textareaRef.current.getBoundingClientRect();
      const relativeX = remotePosition.x - textareaRect.left;
      const relativeY = remotePosition.y - textareaRect.top;
      
      return {
        ...collaborator,
        position: { x: relativeX, y: relativeY }
      };
    })
    .filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            🚀 Liveblocks Test Page
          </h1>
          
          <LiveblocksActiveCollaborators chapterId="test-chapter-123" />
        </div>

        {/* Connection Status */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
              {isConnected ? 'Connected to Liveblocks' : 'Disconnected'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p><strong>Active collaborators:</strong> {collaborators.length + 1}</p>
              <p><strong>Content length:</strong> {storage?.content?.length || 0} chars</p>
              <p><strong>Last modified:</strong> {storage?.lastModified ? new Date(storage.lastModified).toLocaleTimeString() : 'Never'}</p>
            </div>
            <div>
              <p><strong>Storage version:</strong> {storage?.version || 0}</p>
              <p><strong>Typing users:</strong> {collaborators.filter(c => c.isTyping).length}</p>
              <p><strong>Room ID:</strong> chapter:test-chapter-123</p>
            </div>
          </div>
          
          {/* Collaborator details */}
          {collaborators.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Active Collaborators:</p>
              <div className="flex flex-wrap gap-2">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.userId}
                    className="flex items-center space-x-2 px-2 py-1 rounded-full text-xs"
                    style={{ backgroundColor: collaborator.color + '20', color: collaborator.color }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: collaborator.color }}
                    ></div>
                    <span>{collaborator.displayName}</span>
                    {collaborator.isTyping && (
                      <span className="text-xs opacity-75">typing...</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Collaborative Text Area */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Collaborative Text Editor
            </label>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {collaborators.filter(c => c.isTyping).length > 0 && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>{collaborators.filter(c => c.isTyping).length} typing...</span>
                </div>
              )}
              <span>Characters: {content.length}</span>
            </div>
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onSelect={handleCursorMove}
              onMouseUp={handleCursorMove}
              onKeyUp={handleCursorMove}
              placeholder="Start typing here... Others will see your changes in real-time!"
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm relative"
              style={{ lineHeight: '1.5', fontSize: '14px' }}
            />
            
            {/* Active collaborator cursors indicator */}
            {collaborators.length > 0 && (
              <div className="absolute top-2 right-2 flex -space-x-1">
                {collaborators.slice(0, 3).map((collaborator) => (
                  <div
                    key={collaborator.userId}
                    className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: collaborator.color }}
                    title={`${collaborator.displayName} ${collaborator.isTyping ? '(typing...)' : ''}`}
                  >
                    {collaborator.displayName.charAt(0).toUpperCase()}
                  </div>
                ))}
                {collaborators.length > 3 && (
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs font-bold text-white">
                    +{collaborators.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* Remote cursors overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {remoteCursors.map((collaborator) => {
                if (!collaborator.position) return null;
                
                return (
                  <div key={`cursor-${collaborator.userId}`}>
                    {/* Cursor */}
                    <div
                      className={`absolute w-0.5 h-5 ${collaborator.isTyping ? 'animate-pulse' : ''}`}
                      style={{
                        backgroundColor: collaborator.color,
                        left: `${collaborator.position.x}px`,
                        top: `${collaborator.position.y}px`,
                        zIndex: 10,
                        boxShadow: collaborator.isTyping ? `0 0 8px ${collaborator.color}` : 'none',
                      }}
                    >
                      {/* Cursor label */}
                      <div
                        className={`absolute -top-6 left-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-sm ${
                          collaborator.isTyping ? 'animate-bounce' : ''
                        }`}
                        style={{ backgroundColor: collaborator.color }}
                      >
                        {collaborator.displayName}
                        {collaborator.isTyping && (
                          <span className="ml-1">⌨️</span>
                        )}
                      </div>
                    </div>

                    {/* Text selection highlight */}
                    {collaborator.selectionStart !== undefined && 
                     collaborator.selectionEnd !== undefined && 
                     collaborator.selectionStart !== collaborator.selectionEnd && (
                      <div
                        className="absolute opacity-20"
                        style={{
                          backgroundColor: collaborator.color,
                          left: `${collaborator.position.x}px`,
                          top: `${collaborator.position.y}px`,
                          width: '2px',
                          height: '20px',
                          zIndex: 5,
                        }}
                      />
                    )}

                    {/* Typing indicator dot */}
                    {collaborator.isTyping && (
                      <div
                        className="absolute w-3 h-3 rounded-full animate-ping"
                        style={{
                          backgroundColor: collaborator.color,
                          left: `${collaborator.position.x - 6}px`,
                          top: `${collaborator.position.y - 6}px`,
                          zIndex: 15,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Open this page in multiple browser tabs to test real-time collaboration
          </p>
        </div>

        {/* Features List */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            ✨ Liveblocks Features Demo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Real-time content synchronization</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>User presence indicators</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Automatic conflict resolution</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Typing indicators</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Persistent collaboration state</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Scalable infrastructure</span>
            </div>
          </div>
        </div>

        {/* Real-time Activity Log */}
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-medium text-purple-800 mb-2">⚡ Real-time Activity</h4>
          <div className="text-sm text-purple-700 space-y-1">
            <p>✨ <strong>Content sync:</strong> {content.length > 0 ? `${content.length} characters synced` : 'No content yet'}</p>
            <p>👥 <strong>Presence:</strong> {collaborators.length} other users online</p>
            <p>⌨️ <strong>Typing status:</strong> {collaborators.filter(c => c.isTyping).length} users typing</p>
            <p>🖱️ <strong>Active cursors:</strong> {collaborators.filter(c => c.cursorPosition !== undefined).length} cursors visible</p>
            <p>🔄 <strong>Last activity:</strong> {Date.now() - lastTypingTime < 3000 ? 'Just now' : 'Idle'}</p>
            <p>💾 <strong>Storage state:</strong> {storage ? 'Loaded' : 'Loading...'}</p>
            <p>📍 <strong>Your cursor:</strong> Position {cursorPosition.column} on line {cursorPosition.line + 1}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">🧪 How to Test:</h4>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Make sure you have added your Liveblocks keys to .env.local</li>
            <li>2. Open this page in multiple browser tabs or windows</li>
            <li>3. Start typing in the text area</li>
            <li>4. Watch as changes appear in real-time across all tabs</li>
            <li>5. Notice the presence indicators showing active collaborators</li>
            <li>6. Try selecting text to see cursor position tracking</li>
          </ol>
          
          <div className="mt-3 pt-3 border-t border-yellow-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-yellow-600">
                <strong>Troubleshooting:</strong> If features aren't working, check your configuration:
              </p>
              <button
                onClick={testLiveblocksConfig}
                className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
              >
                Test Config
              </button>
            </div>
            
            {debugInfo && (
              <div className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800 font-mono">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with Liveblocks provider
export default function TestLiveblocksPage() {
  return (
    <LiveblocksRoomProvider 
      chapterId="test-chapter-123"
      initialContent="Welcome to the Liveblocks test! Start typing to see real-time collaboration in action."
    >
      <LiveblocksTest />
    </LiveblocksRoomProvider>
  );
} 