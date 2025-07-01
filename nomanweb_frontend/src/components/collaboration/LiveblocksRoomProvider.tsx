'use client';

import React, { Suspense } from 'react';
import { RoomProvider } from '@/lib/liveblocks';
import { generateRoomId } from '@/lib/liveblocks';
import { useAuth } from '@/contexts/AuthContext';
import { ClientSideSuspense } from '@liveblocks/react';

interface LiveblocksRoomProviderProps {
  chapterId: string;
  children: React.ReactNode;
  initialContent?: string;
}

export const LiveblocksRoomProvider: React.FC<LiveblocksRoomProviderProps> = ({ 
  chapterId, 
  children, 
  initialContent = '' 
}) => {
  const { user } = useAuth();
  const roomId = generateRoomId(chapterId);

  console.log('LiveblocksRoomProvider: Setting up room:', {
    chapterId,
    roomId,
    userId: user?.id,
    hasUser: !!user,
    initialContentLength: initialContent.length
  });

  // Don't render if user is not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Please log in to collaborate</div>
      </div>
    );
  }

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        userId: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        profileImageUrl: user.profileImageUrl,
        color: '#4A90E2',
        isTyping: false,
        lastActivity: Date.now(),
      }}
      initialStorage={{
        content: initialContent,
        lastModified: Date.now(),
        lastModifiedBy: user.id,
        version: 1,
      }}
    >
      <ClientSideSuspense fallback={<CollaborationLoading />}>
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  );
};

// Loading component for collaboration setup
const CollaborationLoading: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-2 text-blue-600">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      <span className="text-sm">Setting up collaboration...</span>
    </div>
  </div>
);

// Higher-order component to easily wrap any component with Liveblocks
export const withLiveblocks = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return React.forwardRef<any, P & { chapterId: string; initialContent?: string }>((props, ref) => {
    const { chapterId, initialContent, ...componentProps } = props;
    
    return (
      <LiveblocksRoomProvider chapterId={chapterId} initialContent={initialContent}>
        <Component {...(componentProps as P)} ref={ref} />
      </LiveblocksRoomProvider>
    );
  });
}; 