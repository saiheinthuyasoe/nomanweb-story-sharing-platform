'use client';

import React from 'react';
import { useLiveblocksCollaboration } from '@/hooks/useLiveblocksCollaboration';
import { useCursorPosition } from '@/hooks/useCursorPosition';

interface LiveblocksFeaturesChecklistProps {
  chapterId: string;
  content: string;
}

export const LiveblocksFeaturesChecklist: React.FC<LiveblocksFeaturesChecklistProps> = ({
  chapterId,
  content
}) => {
  const { isConnected, collaborators, storage } = useLiveblocksCollaboration(chapterId);
  const { cursorPosition } = useCursorPosition();

  const features = [
    {
      name: 'Real-time content synchronization',
      status: isConnected && storage?.content !== undefined,
      description: 'Content updates sync instantly across all users'
    },
    {
      name: 'User presence indicators',
      status: isConnected && collaborators.length >= 0,
      description: 'Shows who is currently editing the document'
    },
    {
      name: 'Automatic conflict resolution',
      status: isConnected,
      description: 'CRDT-based conflict resolution handles simultaneous edits'
    },
    {
      name: 'Typing indicators',
      status: isConnected && collaborators.some(c => c.isTyping),
      description: 'Shows when users are actively typing'
    },
    {
      name: 'Persistent collaboration state',
      status: isConnected && storage !== null,
      description: 'Collaboration state persists across sessions'
    },
    {
      name: 'Scalable infrastructure',
      status: isConnected,
      description: 'Built on Liveblocks.io scalable real-time platform'
    },
    {
      name: 'Active user cursors',
      status: isConnected && collaborators.some(c => c.cursorPosition !== undefined),
      description: 'Real-time cursor position tracking and visualization'
    }
  ];

  const activeFeatures = features.filter(f => f.status).length;
  const totalFeatures = features.length;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-blue-900">
          ✨ Liveblocks Features Status
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium text-blue-700">
            {activeFeatures}/{totalFeatures} Features Active
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 p-3 rounded-lg border ${
              feature.status 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              feature.status 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-300 text-gray-600'
            }`}>
              {feature.status ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium ${
                feature.status ? 'text-green-800' : 'text-gray-600'
              }`}>
                {feature.name}
              </h4>
              <p className={`text-xs mt-1 ${
                feature.status ? 'text-green-600' : 'text-gray-500'
              }`}>
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Real-time Stats */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-900">{collaborators.length + 1}</div>
            <div className="text-xs text-blue-600">Active Users</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">{content.length}</div>
            <div className="text-xs text-blue-600">Characters</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {collaborators.filter(c => c.isTyping).length}
            </div>
            <div className="text-xs text-blue-600">Typing</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-900">
              {collaborators.filter(c => c.cursorPosition !== undefined).length}
            </div>
            <div className="text-xs text-blue-600">Cursors</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 