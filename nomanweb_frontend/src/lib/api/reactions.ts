import { apiClient } from './client';

export interface ReactionStatus {
  liked: boolean;
  totalLikes: number;
}

export interface ReactionResponse {
  liked: boolean;
  totalLikes: number;
  message: string;
}

export const reactionsApi = {
  // Story reactions
  async toggleStoryLike(storyId: string): Promise<ReactionResponse> {
    const response = await apiClient.post(`/reactions/story/${storyId}/like`);
    return response.data;
  },

  async getStoryReactionStatus(storyId: string): Promise<ReactionStatus> {
    const response = await apiClient.get(`/reactions/story/${storyId}/status`);
    return response.data;
  },

  // Chapter reactions
  async toggleChapterLike(chapterId: string): Promise<ReactionResponse> {
    const response = await apiClient.post(`/reactions/chapter/${chapterId}/like`);
    return response.data;
  },

  async getChapterReactionStatus(chapterId: string): Promise<ReactionStatus> {
    const response = await apiClient.get(`/reactions/chapter/${chapterId}/status`);
    return response.data;
  },
}; 