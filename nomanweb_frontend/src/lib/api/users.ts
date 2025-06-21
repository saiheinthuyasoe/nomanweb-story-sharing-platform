import { apiClient } from './client';

export interface UserStats {
  userId: string;
  writtenBooks: number;
  readBooks: number;
  followers: number;
  following: number;
  totalViews: number;
  totalLikes: number;
  totalEarnedCoins: number;
  booksCompleted: number;
  booksPurchased: number;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  coinBalance: number;
  totalEarnedCoins: number;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  stats: UserStats;
}

export interface FollowerUser {
  id: string;
  username: string;
  displayName?: string;
  profileImageUrl?: string;
  followedAt: string;
}

const usersApi = {
  // Get user profile by ID (for viewing other users)
  getUserProfile: async (userId: string): Promise<UserProfile> => {
    const response = await apiClient.get(`/users/${userId}/profile`);
    return response.data;
  },

  // Get user statistics
  getUserStats: async (userId: string): Promise<UserStats> => {
    const response = await apiClient.get(`/users/${userId}/stats`);
    return response.data;
  },

  // Get current user's statistics  
  getMyStats: async (): Promise<UserStats> => {
    const response = await apiClient.get(`/users/me/stats`);
    return response.data;
  },

  // Get followers list
  getFollowers: async (userId: string, page = 0, size = 20): Promise<{
    content: FollowerUser[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get(`/users/${userId}/followers?page=${page}&size=${size}`);
    return response.data;
  },

  // Get following list
  getFollowing: async (userId: string, page = 0, size = 20): Promise<{
    content: FollowerUser[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get(`/users/${userId}/following?page=${page}&size=${size}`);
    return response.data;
  },

  // Follow/unfollow user
  followUser: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/follow`);
  },

  unfollowUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/follow`);
  },

  // Check if current user follows another user
  isFollowing: async (userId: string): Promise<boolean> => {
    const response = await apiClient.get(`/users/${userId}/is-following`);
    return response.data.isFollowing;
  },
};

export { usersApi }; 