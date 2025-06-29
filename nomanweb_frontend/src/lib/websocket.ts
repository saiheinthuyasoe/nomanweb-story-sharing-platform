import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface RealtimeCollaborationMessage {
  type: 'CONTENT_UPDATE' | 'CURSOR_POSITION' | 'SELECTION_RANGE' | 'USER_JOINED' | 'USER_LEFT' | 'PRESENCE_UPDATE';
  chapterId: string;
  userId: string;
  username?: string;
  displayName?: string;
  profileImageUrl?: string;
  timestamp: string;
  
  // Content update specific fields
  content?: string;
  position?: number;
  length?: number;
  operation?: string;
  
  // Cursor and selection specific fields
  cursorPosition?: number;
  selectionStart?: number;
  selectionEnd?: number;
  
  // Presence specific fields
  isOnline?: boolean;
  color?: string;
}

export interface WebSocketCallbacks {
  onContentUpdate?: (message: RealtimeCollaborationMessage) => void;
  onCursorPosition?: (message: RealtimeCollaborationMessage) => void;
  onSelectionRange?: (message: RealtimeCollaborationMessage) => void;
  onUserJoined?: (message: RealtimeCollaborationMessage) => void;
  onUserLeft?: (message: RealtimeCollaborationMessage) => void;
  onPresenceUpdate?: (message: RealtimeCollaborationMessage) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
}

class WebSocketClient {
  private client: Client | null = null;
  private callbacks: WebSocketCallbacks = {};
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentChapterId: string | null = null;
  private userInfo: {
    username: string;
    displayName: string;
    profileImageUrl: string;
  } | null = null;

  connect(
    chapterId: string,
    userId: string,
    username: string,
    displayName: string,
    profileImageUrl: string,
    callbacks: WebSocketCallbacks
  ) {
    // If already connected to the same chapter, just update callbacks
    if (this.isConnected && this.currentChapterId === chapterId) {
      this.callbacks = callbacks;
      return;
    }

    // If connected to a different chapter, disconnect first
    if (this.isConnected && this.currentChapterId !== chapterId) {
      this.leaveChapter(this.currentChapterId!);
      this.disconnect();
    }

    this.callbacks = callbacks;
    this.currentChapterId = chapterId;
    this.userInfo = {
      username,
      displayName,
      profileImageUrl
    };

    // Get JWT token from cookies or localStorage
    const token = this.getAuthToken();

    // Create STOMP client
    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        'username': username,
        'displayName': displayName,
        'profileImageUrl': profileImageUrl || '',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // Connection handlers
    this.client.onConnect = () => {
      console.log('WebSocket connected - onConnect fired');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('Calling onConnected callback...');
      this.callbacks.onConnected?.();
      console.log('onConnected callback completed');

      // Subscribe to chapter topics
      this.subscribeToChapterTopics(chapterId);
      
      // Join the chapter
      this.joinChapter(chapterId);
    };

    this.client.onDisconnect = () => {
      console.log('WebSocket disconnected - onDisconnect fired');
      this.isConnected = false;
      this.currentChapterId = null;
      console.log('Calling onDisconnected callback...');
      this.callbacks.onDisconnected?.();
      console.log('onDisconnected callback completed');
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP error:', frame);
      this.callbacks.onError?.(frame);
    };

    // Connect to WebSocket
    this.client.activate();
  }

  private subscribeToChapterTopics(chapterId: string) {
    if (!this.client?.connected) return;

    // Subscribe to content updates
    this.client.subscribe(`/topic/chapter/${chapterId}/content`, (message) => {
      console.log('WebSocket: Received content update message:', {
        messageBody: message.body,
        destination: message.destination,
        bodyLength: message.body?.length || 0
      });
      
      try {
        const data: RealtimeCollaborationMessage = JSON.parse(message.body);
        console.log('WebSocket: Parsed content update data:', {
          type: data.type,
          chapterId: data.chapterId,
          userId: data.userId,
          contentLength: data.content?.length || 0,
          contentPreview: data.content?.substring(0, 100) + '...',
          timestamp: data.timestamp
        });
        
        this.callbacks.onContentUpdate?.(data);
        console.log('WebSocket: Content update callback executed successfully');
      } catch (error) {
        console.error('WebSocket: Error parsing content update message:', error);
      }
    });

    // Subscribe to cursor position updates
    this.client.subscribe(`/topic/chapter/${chapterId}/cursor`, (message) => {
      const data: RealtimeCollaborationMessage = JSON.parse(message.body);
      this.callbacks.onCursorPosition?.(data);
    });

    // Subscribe to selection range updates
    this.client.subscribe(`/topic/chapter/${chapterId}/selection`, (message) => {
      const data: RealtimeCollaborationMessage = JSON.parse(message.body);
      this.callbacks.onSelectionRange?.(data);
    });

    // Subscribe to presence updates (public channel)
    this.client.subscribe(`/topic/chapter/${chapterId}/presence`, (message) => {
      console.log('WebSocket: Received presence update:', message.body);
      const data: RealtimeCollaborationMessage = JSON.parse(message.body);
      
      switch (data.type) {
        case 'USER_JOINED':
          console.log('WebSocket: User joined:', data.username);
          this.callbacks.onUserJoined?.(data);
          break;
        case 'USER_LEFT':
          console.log('WebSocket: User left:', data.username);
          this.callbacks.onUserLeft?.(data);
          break;
        case 'PRESENCE_UPDATE':
          console.log('WebSocket: Presence update:', data.username);
          this.callbacks.onPresenceUpdate?.(data);
          break;
      }
    });

    // Subscribe to user-specific presence queue (for existing users)
    this.client.subscribe(`/user/queue/presence`, (message) => {
      console.log('WebSocket: Received user-specific presence update:', message.body);
      const data: RealtimeCollaborationMessage = JSON.parse(message.body);
      
      if (data.type === 'USER_JOINED') {
        console.log('WebSocket: Existing user sent to new user:', data.username);
        this.callbacks.onUserJoined?.(data);
      }
    });
  }

  private joinChapter(chapterId: string) {
    if (!this.client?.connected) return;

    console.log('WebSocket: Joining chapter with user info:', {
      chapterId,
      username: this.userInfo?.username,
      displayName: this.userInfo?.displayName,
      profileImageUrl: this.userInfo?.profileImageUrl,
      hasUserInfo: !!this.userInfo
    });
    
    const joinMessage = {
      chapterId,
      username: this.userInfo?.username || '',
      displayName: this.userInfo?.displayName || '',
      profileImageUrl: this.userInfo?.profileImageUrl || ''
    };
    
    this.client.publish({
      destination: `/app/chapter/${chapterId}/join`,
      body: JSON.stringify(joinMessage)
    });
    
    console.log('WebSocket: Join message sent with body:', joinMessage);
  }

  leaveChapter(chapterId: string) {
    if (!this.client?.connected) return;

    this.client.publish({
      destination: `/app/chapter/${chapterId}/leave`,
      body: chapterId,
    });
  }

  sendContentUpdate(chapterId: string, userId: string, content: string, position: number, length: number, operation: string) {
    if (!this.client?.connected) {
      console.log('WebSocket: Cannot send content update - not connected');
      return;
    }

    console.log('WebSocket: Sending content update:', {
      chapterId,
      userId,
      contentLength: content.length,
      position,
      length,
      operation,
      destination: `/app/chapter/${chapterId}/content`
    });

    const message: RealtimeCollaborationMessage = {
      type: 'CONTENT_UPDATE',
      chapterId,
      userId,
      content,
      position,
      length,
      operation,
      timestamp: new Date().toISOString(),
    };

    console.log('WebSocket: Content update message payload:', {
      messageType: message.type,
      messageContentLength: message.content?.length || 0,
      messageContentPreview: message.content?.substring(0, 100) + '...'
    });

    this.client.publish({
      destination: `/app/chapter/${chapterId}/content`,
      body: JSON.stringify(message),
    });

    console.log('WebSocket: Content update message sent successfully');
  }

  sendCursorPosition(chapterId: string, userId: string, cursorPosition: number) {
    if (!this.client?.connected) return;

    const message: RealtimeCollaborationMessage = {
      type: 'CURSOR_POSITION',
      chapterId,
      userId,
      cursorPosition,
      timestamp: new Date().toISOString(),
    };

    this.client.publish({
      destination: `/app/chapter/${chapterId}/cursor`,
      body: JSON.stringify(message),
    });
  }

  sendSelectionRange(chapterId: string, userId: string, selectionStart: number, selectionEnd: number) {
    if (!this.client?.connected) return;

    const message: RealtimeCollaborationMessage = {
      type: 'SELECTION_RANGE',
      chapterId,
      userId,
      selectionStart,
      selectionEnd,
      timestamp: new Date().toISOString(),
    };

    this.client.publish({
      destination: `/app/chapter/${chapterId}/selection`,
      body: JSON.stringify(message),
    });
  }

  sendPresenceUpdate(chapterId: string, userId: string, isOnline: boolean) {
    if (!this.client?.connected) return;

    const message: RealtimeCollaborationMessage = {
      type: 'PRESENCE_UPDATE',
      chapterId,
      userId,
      isOnline,
      timestamp: new Date().toISOString(),
    };

    this.client.publish({
      destination: `/app/chapter/${chapterId}/presence`,
      body: JSON.stringify(message),
    });
  }

  disconnect() {
    if (this.client) {
      // Leave current chapter before disconnecting
      if (this.currentChapterId) {
        this.leaveChapter(this.currentChapterId);
      }
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
      this.currentChapterId = null;
    }
  }

  isConnectedToWebSocket() {
    const connected = this.isConnected && this.client?.connected;
    console.log('WebSocket connection status:', {
      isConnected: this.isConnected,
      clientConnected: this.client?.connected,
      finalStatus: connected,
      currentChapterId: this.currentChapterId
    });
    return connected;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      clientConnected: this.client?.connected,
      currentChapterId: this.currentChapterId,
      hasClient: !!this.client
    };
  }

  private getAuthToken(): string | null {
    // Try to get token from cookies first
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    
    // Fallback to localStorage
    return localStorage.getItem('token');
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient(); 