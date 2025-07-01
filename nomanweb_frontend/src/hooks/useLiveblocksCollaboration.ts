import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMyPresence,
  useOthers,
  useStorage,
  useMutation,
  useBroadcastEvent,
  useEventListener,
  generateUserColor,
  type Presence,
  type RoomEvent,
} from '@/lib/liveblocks';

// Collaborator interface matching the original API
export interface Collaborator {
  userId: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  color: string;
  isOnline: boolean;
  cursorPosition?: number;
  selectionStart?: number;
  selectionEnd?: number;
  isTyping: boolean;
  lastSeen: Date;
}

export interface LiveblocksCollaborationState {
  isConnected: boolean;
  collaborators: Collaborator[];
  activeCollaboratorCount: number;
  error: string | null;
}

export const useLiveblocksCollaboration = (chapterId: string) => {
  const { user } = useAuth();
  const [state, setState] = useState<LiveblocksCollaborationState>({
    isConnected: false,
    collaborators: [],
    activeCollaboratorCount: 0,
    error: null,
  });

  // Liveblocks hooks
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const storage = useStorage((root) => ({
    content: root?.content || '',
    lastModified: root?.lastModified || Date.now(),
    lastModifiedBy: root?.lastModifiedBy || '',
    version: root?.version || 1,
  }));
  const broadcast = useBroadcastEvent();

  // Content update callbacks
  const [contentUpdateCallbacks] = useState<Set<(content: string) => void>>(new Set());

  // Initialize user presence when user is available
  useEffect(() => {
    if (!user) {
      console.log('Liveblocks: No user available for presence initialization');
      return;
    }

    const initialPresence: Presence = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      profileImageUrl: user.profileImageUrl,
      color: generateUserColor(),
      isTyping: false,
      lastActivity: Date.now(),
    };

    console.log('Liveblocks: Initializing user presence:', initialPresence);
    updateMyPresence(initialPresence);
    setState(prev => ({ ...prev, isConnected: true }));
  }, [user, updateMyPresence]);

  // Convert Liveblocks others to our Collaborator format
  const collaborators = useMemo(() => {
    return others.map((other): Collaborator => ({
      userId: other.presence.userId,
      username: other.presence.username,
      displayName: other.presence.displayName,
      profileImageUrl: other.presence.profileImageUrl,
      color: other.presence.color,
      isOnline: true,
      cursorPosition: other.presence.cursor?.position,
      selectionStart: other.presence.selection?.start,
      selectionEnd: other.presence.selection?.end,
      isTyping: other.presence.isTyping,
      lastSeen: new Date(other.presence.lastActivity),
    }));
  }, [others]);

  // Update state when collaborators change
  useEffect(() => {
    console.log('Liveblocks: Collaborators updated:', {
      count: collaborators.length,
      collaborators: collaborators.map(c => ({
        userId: c.userId,
        displayName: c.displayName,
        isTyping: c.isTyping,
        lastSeen: c.lastSeen
      }))
    });
    setState(prev => ({
      ...prev,
      collaborators,
      activeCollaboratorCount: collaborators.length,
    }));
  }, [collaborators]);

  // Debug storage changes
  useEffect(() => {
    console.log('Liveblocks: Storage updated:', {
      hasStorage: !!storage,
      contentLength: storage?.content?.length || 0,
      lastModified: storage?.lastModified,
      version: storage?.version
    });
  }, [storage]);

  // Content update mutation
  const updateContent = useMutation(({ storage }, content: string) => {
    storage.set('content', content);
    storage.set('lastModified', Date.now());
    storage.set('lastModifiedBy', user?.id || 'unknown');
  }, [user?.id]);

  // Send content update
  const sendContentUpdate = useCallback((content: string, position: number, length: number, operation: string) => {
    if (!user) {
      console.log('Liveblocks: Cannot send content update - no user');
      return;
    }

    console.log('Liveblocks: Sending content update:', { 
      contentLength: content.length, 
      position, 
      length, 
      operation, 
      userId: user.id 
    });

    // Update storage with new content
    updateContent(content);

    // Broadcast content change event
    broadcast({
      type: 'CONTENT_CHANGED',
      data: {
        content,
        position,
        length,
        operation,
        userId: user.id,
        timestamp: Date.now(),
      },
    });

    // Immediately set typing status for responsive feedback
    console.log('Liveblocks: Setting typing status to true for user:', user.id);
    updateMyPresence({
      isTyping: true,
      lastActivity: Date.now(),
    });

    // Clear typing status after a shorter delay for more responsive feel
    setTimeout(() => {
      console.log('Liveblocks: Clearing typing status for user:', user.id);
      updateMyPresence({
        isTyping: false,
        lastActivity: Date.now(),
      });
    }, 1000); // Reduced to 1000ms for even faster response like test page
  }, [user, updateContent, broadcast, updateMyPresence]);

  // Send cursor position
  const sendCursorPosition = useCallback((position: number) => {
    if (!user) return;

    // Immediately set typing status for responsive feedback
    updateMyPresence({
      cursor: { position },
      isTyping: true,
      lastActivity: Date.now(),
    });

    broadcast({
      type: 'CURSOR_MOVED',
      data: {
        userId: user.id,
        position,
        timestamp: Date.now(),
      },
    });

    // Clear typing status after a shorter delay for more responsive feel
    setTimeout(() => {
      updateMyPresence({
        isTyping: false,
        lastActivity: Date.now(),
      });
    }, 1000); // Reduced to 1000ms for even faster response like test page
  }, [user, updateMyPresence, broadcast]);

  // Send selection range
  const sendSelectionRange = useCallback((selectionStart: number, selectionEnd: number) => {
    if (!user) return;

    updateMyPresence({
      selection: {
        start: selectionStart,
        end: selectionEnd,
      },
      isTyping: true,
      lastActivity: Date.now(),
    });
  }, [user, updateMyPresence]);

  // Register content update callback
  const registerContentUpdateCallback = useCallback((callback: (content: string) => void) => {
    console.log('Liveblocks: Registering content update callback');
    contentUpdateCallbacks.add(callback);
    
    return () => {
      console.log('Liveblocks: Unregistering content update callback');
      contentUpdateCallbacks.delete(callback);
    };
  }, [contentUpdateCallbacks]);

  // Listen for content change events
  useEventListener(({ event, user: eventUser }) => {
    console.log('Liveblocks: Received event:', event.type, 'from user:', eventUser?.id);
    
    if (event.type === 'CONTENT_CHANGED' && event.data.userId !== user?.id) {
      // Apply content update to all registered callbacks
      contentUpdateCallbacks.forEach(callback => {
        try {
          callback(event.data.content);
        } catch (error) {
          console.error('Error in content update callback:', error);
        }
      });
    }
  });

  // Send presence update (heartbeat)
  const sendPresenceUpdate = useCallback((chapterId: string, userId: string, isOnline: boolean) => {
    if (!user) return;

    updateMyPresence({
      isTyping: false,
      lastActivity: Date.now(),
    });
  }, [user, updateMyPresence]);

  // Return the same API as the original hook
  return {
    // State
    isConnected: state.isConnected,
    collaborators: state.collaborators,
    activeCollaboratorCount: state.activeCollaboratorCount,
    error: state.error,

    // Actions
    sendContentUpdate,
    sendCursorPosition,
    sendSelectionRange,
    sendPresenceUpdate,
    registerContentUpdateCallback,

    // Additional Liveblocks features
    storage,
    broadcast,
    myPresence,
    others,
  };
}; 