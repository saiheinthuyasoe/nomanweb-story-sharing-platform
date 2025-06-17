import { apiClient } from './client';
import { 
  Story, 
  StoryPreview, 
  CreateStoryRequest, 
  UpdateStoryRequest, 
  StoriesResponse,
  Category 
} from '@/types/story';

export interface GetStoriesParams {
  page?: number;
  size?: number;
  sortBy?: string;
  status?: string;
  categoryId?: string;
  contentType?: string;
  authorId?: string;
}

export interface SearchStoriesParams {
  query: string;
  page?: number;
  size?: number;
}

export const storiesApi = {
  // Basic CRUD operations
  async createStory(data: CreateStoryRequest): Promise<Story> {
    const response = await apiClient.post('/stories', data);
    return response.data;
  },

  async getStory(id: string): Promise<Story> {
    const response = await apiClient.get(`/stories/${id}`);
    return response.data;
  },

  async updateStory(id: string, data: UpdateStoryRequest): Promise<Story> {
    const response = await apiClient.put(`/stories/${id}`, data);
    return response.data;
  },

  async deleteStory(id: string): Promise<void> {
    await apiClient.delete(`/stories/${id}`);
  },

  // Story listing with pagination and filters
  async getStories(params: GetStoriesParams = {}): Promise<StoriesResponse> {
    const response = await apiClient.get('/stories', { params });
    return response.data;
  },

  async getMyStories(params: { page?: number; size?: number } = {}): Promise<StoriesResponse> {
    const response = await apiClient.get('/stories/my-stories', { params });
    return response.data;
  },

  async getStoriesByAuthor(
    authorId: string, 
    params: { page?: number; size?: number } = {}
  ): Promise<StoriesResponse> {
    const response = await apiClient.get(`/stories/author/${authorId}`, { params });
    return response.data;
  },

  async getStoriesByCategory(
    categoryId: string, 
    params: { page?: number; size?: number } = {}
  ): Promise<StoriesResponse> {
    const response = await apiClient.get(`/stories/category/${categoryId}`, { params });
    return response.data;
  },

  // Discovery and search
  async searchStories(params: SearchStoriesParams): Promise<StoriesResponse> {
    const response = await apiClient.get('/stories/search', { params });
    return response.data;
  },

  async getTrendingStories(params: { page?: number; size?: number } = {}): Promise<StoriesResponse> {
    const response = await apiClient.get('/stories/trending', { params });
    return response.data;
  },

  async getFeaturedStories(params: { page?: number; size?: number } = {}): Promise<StoriesResponse> {
    const response = await apiClient.get('/stories/featured', { params });
    return response.data;
  },

  // Story actions
  async publishStory(id: string): Promise<Story> {
    const response = await apiClient.post(`/stories/${id}/publish`);
    return response.data;
  },

  async unpublishStory(id: string): Promise<Story> {
    const response = await apiClient.post(`/stories/${id}/unpublish`);
    return response.data;
  },

  async canUserAccessStory(id: string): Promise<boolean> {
    const response = await apiClient.get(`/stories/${id}/can-access`);
    return response.data;
  },
};

export const categoriesApi = {
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  async getCategory(id: string): Promise<Category> {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },
}; 