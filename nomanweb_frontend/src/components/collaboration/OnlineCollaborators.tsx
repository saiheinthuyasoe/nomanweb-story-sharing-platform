'use client';

import React, { useEffect } from 'react';
import { useOnlineCollaborators, useUpdatePresence } from '@/hooks/useCollaborations';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface OnlineCollaboratorsProps {
  chapterId: string;
  onCollaboratorClick?: (userId: string) => void;
}

// Predefined colors for collaborators
const COLLABORATOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
];

export function OnlineCollaborators({ chapterId, onCollaboratorClick }: OnlineCollaboratorsProps) {
  const { user } = useAuth();
  const { data: collaborators = [] } = useOnlineCollaborators(chapterId);
  const { mutate: updatePresence } = useUpdatePresence(chapterId);

  // Update own presence every 30 seconds
  useEffect(() => {
    if (!user) return;

    const updateOwnPresence = () => {
      updatePresence({
        userId: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        profileImageUrl: user.profileImageUrl,
        isOnline: true,
        lastSeenAt: new Date().toISOString(),
      });
    };

    // Update immediately
    updateOwnPresence();

    // Update periodically
    const interval = setInterval(updateOwnPresence, 30000);

    // Update on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateOwnPresence();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, chapterId, updatePresence]);

  // Assign colors to collaborators
  const collaboratorsWithColors = collaborators.map((collaborator, index) => ({
    ...collaborator,
    color: collaborator.color || COLLABORATOR_COLORS[index % COLLABORATOR_COLORS.length],
  }));

  if (collaborators.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">Online:</span>
      
      <div className="flex -space-x-2">
        {collaboratorsWithColors.map((collaborator) => (
          <div
            key={collaborator.userId}
            className="relative group"
            onClick={() => onCollaboratorClick?.(collaborator.userId)}
          >
            {/* Avatar */}
            <div
              className="relative w-8 h-8 rounded-full ring-2 ring-white cursor-pointer hover:z-10 transition-transform hover:scale-110"
              style={{ backgroundColor: collaborator.color }}
            >
              {collaborator.profileImageUrl ? (
                <Image
                  src={collaborator.profileImageUrl}
                  alt={collaborator.displayName}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium">
                  {collaborator.displayName[0].toUpperCase()}
                </div>
              )}
              
              {/* Online Indicator */}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white"></div>
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              <div className="font-medium">{collaborator.displayName}</div>
              <div className="text-gray-300">
                {collaborator.role === 'EDIT' ? 'Editing' : 'Viewing'}
              </div>
              {collaborator.lastSeenAt && (
                <div className="text-gray-400">
                  {formatDistanceToNow(new Date(collaborator.lastSeenAt), { addSuffix: true })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {collaborators.length > 5 && (
        <span className="text-sm text-gray-500">
          +{collaborators.length - 5} more
        </span>
      )}
    </div>
  );
} 