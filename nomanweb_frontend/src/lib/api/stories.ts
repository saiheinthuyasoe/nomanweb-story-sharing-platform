import apiClient  from './client';
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
  pricingType?: string;
  contentStatus?: string;
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
    const response = await apiClient.post<Story>('/stories', data);
    return response.data;
  },

  async getStory(id: string): Promise<Story> {
    const response = await apiClient.get<Story>(`/stories/${id}`);
    return response.data;
  },

  async updateStory(id: string, data: UpdateStoryRequest): Promise<Story> {
    const response = await apiClient.put<Story>(`/stories/${id}`, data);
    return response.data;
  },

  async deleteStory(id: string): Promise<void> {
    await apiClient.delete(`/stories/${id}`);
  },

  async moveStoryToTrash(id: string): Promise<void> {
    await apiClient.post(`/stories/${id}/trash`);
  },

  async restoreStoryFromTrash(id: string): Promise<void> {
    await apiClient.post(`/stories/${id}/restore`);
  },

  async permanentlyDeleteStory(id: string): Promise<void> {
    await apiClient.delete(`/stories/${id}/permanent`);
  },

  // Story listing with pagination and filters
  async getStories(params: GetStoriesParams = {}): Promise<StoriesResponse> {
    const response = await apiClient.get<StoriesResponse>('/stories', { params });
    return response.data;
  },

  async getMyStories(params: { page?: number; size?: number } = {}): Promise<StoriesResponse> {
    const response = await apiClient.get<StoriesResponse>('/stories/my-stories', { params });
    return response.data;
  },

  async getMyStoriesIncludingDeleted(params: { page?: number; size?: number } = {}): Promise<StoriesResponse> {
    const response = await apiClient.get<StoriesResponse>('/stories/my-stories/all', { params });
    return response.data;
  },

  async getStoriesByAuthor(
    authorId: string, 
    params: { page?: number; size?: number } = {}
  ): Promise<StoriesResponse> {
    const response = await apiClient.get<StoriesResponse>(`/stories/author/${authorId}`, { params });
    return response.data;
  },

  async getStoriesByCategory(
    categoryId: string, 
    params: { page?: number; size?: number } = {}
  ): Promise<StoriesResponse> {
    const response = await apiClient.get<StoriesResponse>(`/stories/category/${categoryId}`, { params });
    return response.data;
  },

  // Discovery and search
  async searchStories(params: SearchStoriesParams): Promise<StoriesResponse> {
    const response = await apiClient.get<StoriesResponse>('/stories/search', { params });
    return response.data;
  },

  async getTrendingStories(params: { page?: number; size?: number } = {}): Promise<StoriesResponse> {
    const response = await apiClient.get<StoriesResponse>('/stories/trending', { params });
    return response.data;
  },

  async getFeaturedStories(params: { page?: number; size?: number } = {}): Promise<StoriesResponse> {
    const response = await apiClient.get<StoriesResponse>('/stories/featured', { params });
    return response.data;
  },

  // Story actions
  async publishStory(id: string): Promise<Story> {
    const response = await apiClient.post<Story>(`/stories/${id}/publish`);
    return response.data;
  },

  async unpublishStory(id: string): Promise<Story> {
    const response = await apiClient.post<Story>(`/stories/${id}/unpublish`);
    return response.data;
  },

  async canUserAccessStory(id: string): Promise<boolean> {
    const response = await apiClient.get<boolean>(`/stories/${id}/can-access`);
    return response.data;
  },

  async incrementStoryView(id: string): Promise<void> {
    await apiClient.post(`/stories/${id}/view`);
  },
};

export const categoriesApi = {
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  },

  async getCategory(id: string): Promise<Category> {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  },
}; 