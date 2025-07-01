import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';

// Define the types for our collaborative data structures
export type Presence = {
  // User presence information
  userId: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  color: string;
  
  // Cursor and selection data
  cursor?: {
    position: number;
  };
  selection?: {
    start: number;
    end: number;
  };
  
  // Typing indicator
  isTyping: boolean;
  lastActivity: number;
};

export type Storage = {
  // Document content stored as Live data structure
  content: string;
  
  // Document metadata
  lastModified: number;
  lastModifiedBy: string;
  
  // Version for conflict resolution
  version: number;
};

export type UserMeta = {
  id: string;
  info: {
    username: string;
    displayName: string;
    avatar?: string;
    color: string;
  };
};

export type RoomEvent = {
  type: 'CONTENT_CHANGED' | 'USER_TYPING' | 'CURSOR_MOVED';
  data: any;
};

// Create the Liveblocks client
const client = createClient({
  // Use authentication endpoint for secure server-side auth
  authEndpoint: '/api/liveblocks-auth',
  
  // Throttling for better performance
  throttle: 16, // 60 FPS
});

// Create room context with proper types
export const {
  suspense: {
    RoomProvider,
    useBroadcastEvent,
    useEventListener,
    useMyPresence,
    useOthers,
    useStorage,
    useMutation,
    useHistory,
    useUndo,
    useRedo,
    useCanUndo,
    useCanRedo,
    useRoom,
    useSelf,
  },
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

// Export the client for direct access
export { client };

// Utility function to generate random user colors
export const generateUserColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#686DE0', '#4834D4', '#00C9FF', '#00FF84', '#FF006E'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Room ID generator for chapters
export const generateRoomId = (chapterId: string): string => {
  return `chapter:${chapterId}`;
}; 