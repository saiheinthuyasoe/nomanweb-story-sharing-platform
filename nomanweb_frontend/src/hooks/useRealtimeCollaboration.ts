import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { websocketClient, RealtimeCollaborationMessage, WebSocketCallbacks } from '@/lib/websocket';

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

export interface RealtimeCollaborationState {
  isConnected: boolean;
  collaborators: Collaborator[];
  activeCollaboratorCount: number;
  error: string | null;
}

export const useRealtimeCollaboration = (chapterId: string) => {
  const { user } = useAuth();
  const [state, setState] = useState<RealtimeCollaborationState>({
    isConnected: false,
    collaborators: [],
    activeCollaboratorCount: 0,
    error: null,
  });

  const collaboratorsRef = useRef<Map<string, Collaborator>>(new Map());
  const isInitialized = useRef(false);
  const contentUpdateCallbacksRef = useRef<Set<(content: string) => void>>(new Set());
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const updateCollaborator = useCallback((userId: string, updates: Partial<Collaborator>) => {
    const current = collaboratorsRef.current.get(userId);
    if (current) {
      const updated = { ...current, ...updates };
      collaboratorsRef.current.set(userId, updated);
      setState(prev => ({
        ...prev,
        collaborators: Array.from(collaboratorsRef.current.values()),
        activeCollaboratorCount: collaboratorsRef.current.size,
      }));
    }
  }, []);

  const removeCollaborator = useCallback((userId: string) => {
    collaboratorsRef.current.delete(userId);
    // Clear typing timeout
    const timeout = typingTimeoutsRef.current.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      typingTimeoutsRef.current.delete(userId);
    }
    setState(prev => ({
      ...prev,
      collaborators: Array.from(collaboratorsRef.current.values()),
      activeCollaboratorCount: collaboratorsRef.current.size,
    }));
  }, []);

  // Register content update callback
  const registerContentUpdateCallback = useCallback((callback: (content: string) => void) => {
    console.log('useRealtimeCollaboration: Registering content update callback');
    contentUpdateCallbacksRef.current.add(callback);
    console.log('useRealtimeCollaboration: Total callbacks registered:', contentUpdateCallbacksRef.current.size);
    
    return () => {
      console.log('useRealtimeCollaboration: Unregistering content update callback');
      contentUpdateCallbacksRef.current.delete(callback);
      console.log('useRealtimeCollaboration: Total callbacks remaining:', contentUpdateCallbacksRef.current.size);
    };
  }, []);

  // Memoize callbacks to prevent infinite reconnection loop
  const callbacks: WebSocketCallbacks = useMemo(() => ({
    onConnected: () => {
      console.log('Hook: onConnected callback fired');
      setState(prev => ({ ...prev, isConnected: true, error: null }));
    },
    onDisconnected: () => {
      console.log('Hook: onDisconnected callback fired');
      setState(prev => ({ ...prev, isConnected: false }));
    },
    onError: (error) => {
      console.log('Hook: onError callback fired', error);
      setState(prev => ({ ...prev, error: error.toString() }));
    },
    onUserJoined: (message) => {
      console.log('Hook: onUserJoined callback fired', {
        messageUserId: message.userId,
        currentUserId: user?.id,
        username: message.username,
        isCurrentUser: message.userId === user?.id
      });
      
      if (message.userId === user?.id) {
        console.log('Hook: Skipping self user join');
        return; // Don't add self
      }
      
      const collaborator: Collaborator = {
        userId: message.userId,
        username: message.username || '',
        displayName: message.displayName || '',
        profileImageUrl: message.profileImageUrl,
        color: message.color || '#FF6B6B',
        isOnline: true,
        isTyping: false,
        lastSeen: new Date(message.timestamp),
      };
      
      console.log('Hook: Adding collaborator:', collaborator);
      collaboratorsRef.current.set(message.userId, collaborator);
      
      const newCollaborators = Array.from(collaboratorsRef.current.values());
      console.log('Hook: Updated collaborators list:', newCollaborators.map(c => ({ id: c.userId, name: c.username })));
      
      setState(prev => ({
        ...prev,
        collaborators: newCollaborators,
        activeCollaboratorCount: collaboratorsRef.current.size,
      }));
    },
    onUserLeft: (message) => {
      console.log('Hook: onUserLeft callback fired', message);
      removeCollaborator(message.userId);
    },
    onPresenceUpdate: (message) => {
      console.log('Hook: onPresenceUpdate callback fired', message);
      if (message.userId === user?.id) return; // Don't update self
      
      updateCollaborator(message.userId, {
        isOnline: message.isOnline || false,
        lastSeen: new Date(message.timestamp),
      });
    },
    onCursorPosition: (message) => {
      console.log('Hook: onCursorPosition callback fired', message);
      if (message.userId === user?.id) return; // Don't update self
      
      // Set typing status when cursor moves
      updateCollaborator(message.userId, {
        cursorPosition: message.cursorPosition,
        isTyping: true,
        lastSeen: new Date(message.timestamp),
      });

      // Clear typing status after 2 seconds of no cursor movement
      const timeout = typingTimeoutsRef.current.get(message.userId);
      if (timeout) {
        clearTimeout(timeout);
      }
      
      const newTimeout = setTimeout(() => {
        updateCollaborator(message.userId, { isTyping: false });
        typingTimeoutsRef.current.delete(message.userId);
      }, 2000);
      
      typingTimeoutsRef.current.set(message.userId, newTimeout);
    },
    onSelectionRange: (message) => {
      console.log('Hook: onSelectionRange callback fired', message);
      if (message.userId === user?.id) return; // Don't update self
      
      updateCollaborator(message.userId, {
        selectionStart: message.selectionStart,
        selectionEnd: message.selectionEnd,
        lastSeen: new Date(message.timestamp),
      });
    },
    onContentUpdate: (message) => {
      console.log('Hook: onContentUpdate callback fired', message);
      // Content updates are handled by the editor component
      // Apply the content update to all registered callbacks
      if (message.content) {
        console.log('Hook: Applying content update to', contentUpdateCallbacksRef.current.size, 'callbacks');
        contentUpdateCallbacksRef.current.forEach(callback => {
          try {
            callback(message.content);
          } catch (error) {
            console.error('Error in content update callback:', error);
          }
        });
      }
    },
  }), [user?.id, removeCollaborator, updateCollaborator]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !chapterId || isInitialized.current) return;

    console.log('useRealtimeCollaboration: Initializing connection', {
      user: user?.id,
      chapterId,
      isInitialized: isInitialized.current
    });

    isInitialized.current = true;
    
    websocketClient.connect(
      chapterId,
      user.id,
      user.username,
      user.displayName || user.username,
      user.profileImageUrl || '',
      callbacks
    );

    // Debug: Check connection status after a delay
    setTimeout(() => {
      const status = websocketClient.getConnectionStatus();
      console.log('useRealtimeCollaboration: Connection status after init:', status);
    }, 1000);

    // Cleanup on unmount
    return () => {
      isInitialized.current = false;
      // Clear all typing timeouts
      typingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();
      // Only disconnect if this is the current chapter
      if (websocketClient.isConnectedToWebSocket()) {
        websocketClient.disconnect();
      }
    };
  }, [user, chapterId, callbacks]);

  // Send presence updates periodically
  useEffect(() => {
    if (!state.isConnected || !user) return;

    const interval = setInterval(() => {
      websocketClient.sendPresenceUpdate(chapterId, user.id, true);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [state.isConnected, user, chapterId]);

  // Debug: Force check connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = websocketClient.getConnectionStatus();
      console.log('useRealtimeCollaboration: Periodic connection check:', status);
      
      // If WebSocket is connected but our state shows disconnected, update it
      if (status.clientConnected && !state.isConnected) {
        console.log('useRealtimeCollaboration: Force updating connection status to connected');
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      }
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [state.isConnected]);

  // Send presence update on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (user && state.isConnected) {
        websocketClient.sendPresenceUpdate(chapterId, user.id, !document.hidden);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, state.isConnected, chapterId]);

  const sendContentUpdate = useCallback((content: string, position: number, length: number, operation: string) => {
    if (!user || !state.isConnected) return;
    websocketClient.sendContentUpdate(chapterId, user.id, content, position, length, operation);
  }, [user, state.isConnected, chapterId]);

  const sendCursorPosition = useCallback((cursorPosition: number) => {
    if (!user || !state.isConnected) return;
    websocketClient.sendCursorPosition(chapterId, user.id, cursorPosition);
  }, [user, state.isConnected, chapterId]);

  const sendSelectionRange = useCallback((selectionStart: number, selectionEnd: number) => {
    if (!user || !state.isConnected) return;
    websocketClient.sendSelectionRange(chapterId, user.id, selectionStart, selectionEnd);
  }, [user, state.isConnected, chapterId]);

  return {
    ...state,
    sendContentUpdate,
    sendCursorPosition,
    sendSelectionRange,
    registerContentUpdateCallback,
  };
}; 