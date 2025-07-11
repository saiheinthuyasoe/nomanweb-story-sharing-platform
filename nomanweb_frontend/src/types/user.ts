export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  bio?: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  coinBalance: number;
  totalEarnedCoins: number;
  lineUserId?: string;
  googleId?: string;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  // Flag to indicate if user can use OAuth endpoints (no password required)
  canUseOAuthEndpoints?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Notification types
export interface Notification {
  id: string;
  user: User;
  type: 'NEW_CHAPTER' | 'NEW_STORY' | 'GIFT_RECEIVED' | 'COMMENT' | 'LIKE' | 'FOLLOW' | 'SYSTEM';
  title: string;
  message: string;
  relatedType?: 'STORY' | 'CHAPTER' | 'USER' | 'GIFT' | 'COMMENT';
  relatedId?: string;
  isRead: boolean;
  sentViaLine: boolean;
  lineMessageId?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  new_chapter: number;
  new_story: number;
  gift_received: number;
  comment: number;
  like: number;
  follow: number;
  system: number;
}

// Social interaction types
export interface UserFollow {
  id: string;
  follower: User;
  following: User;
  createdAt: string;
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
} 