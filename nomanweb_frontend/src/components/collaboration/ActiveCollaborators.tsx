'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration';
import { useAuth } from '@/contexts/AuthContext';

interface ActiveCollaboratorsProps {
  chapterId: string;
}

export const ActiveCollaborators: React.FC<ActiveCollaboratorsProps> = ({ chapterId }) => {
  const { user } = useAuth();
  const { collaborators, isConnected } = useRealtimeCollaboration(chapterId);

  if (!isConnected) return null;

  // Include current user in the list
  const allUsers = [
    ...(user ? [{
      userId: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      profileImageUrl: user.profileImageUrl,
      isOnline: true,
      isTyping: false,
      color: '#4A90E2' // Default color for current user
    }] : []),
    ...collaborators
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Active: {allUsers.length}
      </span>
      <div className="flex -space-x-2">
        {allUsers.slice(0, 5).map((collaborator) => (
          <div
            key={collaborator.userId}
            className="relative group"
          >
            <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-800">
              <AvatarImage 
                src={collaborator.profileImageUrl} 
                alt={collaborator.displayName}
              />
              <AvatarFallback 
                style={{ backgroundColor: collaborator.color }}
                className="text-white text-xs font-semibold"
              >
                {collaborator.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Typing indicator */}
            {collaborator.isTyping && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border border-white dark:border-gray-800" />
            )}
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {collaborator.displayName}
              {collaborator.userId === user?.id && ' (You)'}
            </div>
          </div>
        ))}
        
        {/* Show +X more if there are more than 5 users */}
        {allUsers.length > 5 && (
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 border-2 border-white dark:border-gray-800">
            +{allUsers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}; 
 