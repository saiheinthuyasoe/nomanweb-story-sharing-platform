import { apiClient } from './client';

export interface RateStoryRequest {
  rating: number;
}

export interface StoryRatingResponse {
  id: string;
  userId: string;
  username: string;
  storyId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoryRatingStatsResponse {
  storyId: string;
  averageRating: number | null;
  totalRatings: number;
  ratingDistribution: Record<number, number>; // rating value -> count
  userRating: number | null; // Current user's rating, null if not rated
}

export interface RatingResponse {
  success: boolean;
  message: string;
  userRating?: number;
  stats?: StoryRatingStatsResponse;
}

export interface UserRatingResponse {
  hasRated: boolean;
  rating: number | null;
  createdAt?: string;
  updatedAt?: string;
  canRate: boolean;
}

export interface RatingsPageResponse {
  content: StoryRatingResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const ratingsApi = {
  // Rate a story (create or update)
  async rateStory(storyId: string, rating: number): Promise<RatingResponse> {
    const response = await apiClient.post(`/stories/${storyId}/ratings`, {
      rating
    });
    return response.data;
  },

  // Delete user's rating for a story
  async deleteRating(storyId: string): Promise<RatingResponse> {
    const response = await apiClient.delete(`/stories/${storyId}/ratings`);
    return response.data;
  },

  // Get rating statistics for a story
  async getStoryRatingStats(storyId: string): Promise<StoryRatingStatsResponse> {
    const response = await apiClient.get(`/stories/${storyId}/ratings/stats`);
    return response.data;
  },

  // Get all ratings for a story (paginated)
  async getStoryRatings(
    storyId: string,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'desc'
  ): Promise<RatingsPageResponse> {
    const response = await apiClient.get(`/stories/${storyId}/ratings`, {
      params: { page, size, sortBy, sortDir }
    });
    return response.data;
  },

  // Get current user's rating for a story
  async getUserRating(storyId: string): Promise<UserRatingResponse> {
    const response = await apiClient.get(`/stories/${storyId}/ratings/user`);
    return response.data;
  },

  // Get all ratings by a user
  async getUserRatings(userId: string): Promise<StoryRatingResponse[]> {
    const response = await apiClient.get(`/users/${userId}/ratings`);
    return response.data;
  }
};