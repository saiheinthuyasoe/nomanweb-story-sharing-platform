import { apiClient } from './client';

export interface CreateChapterRequest {
  storyId: string;
  title: string;
  content: string;
  chapterNumber?: number;
  coinPrice?: number;
  isFree?: boolean;
  isDraft?: boolean;
}

export interface UpdateChapterRequest {
  title?: string;
  content?: string;
  coinPrice?: number;
  isFree?: boolean;
  chapterNumber?: number;
  shouldPublish?: boolean;
  isAutoSave?: boolean;
}

export interface Chapter {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  coinPrice: number;
  isFree: boolean;
  status: 'DRAFT' | 'PUBLISHED';
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderationNotes?: string;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  story: {
    id: string;
    title: string;
    authorUsername: string;
    totalChapters: number;
  };
  navigation: {
    previousChapterNumber?: number;
    nextChapterNumber?: number;
    hasNext: boolean;
    hasPrevious: boolean;
    totalChapters: number;
  };
}

export interface ChapterPreview {
  id: string;
  chapterNumber: number;
  title: string;
  wordCount: number;
  coinPrice: number;
  isFree: boolean;
  status: 'DRAFT' | 'PUBLISHED';
  views: number;
  likes: number;
  createdAt: string;
  publishedAt?: string;
}

export const chaptersApi = {
  // Create a new chapter
  async createChapter(data: CreateChapterRequest): Promise<Chapter> {
    console.log('chaptersApi.createChapter - Request data:', {
      storyId: data.storyId,
      title: data.title,
      contentLength: data.content?.length || 0,
      contentPreview: data.content?.substring(0, 100) || '',
      chapterNumber: data.chapterNumber,
      coinPrice: data.coinPrice,
      isFree: data.isFree,
      isDraft: data.isDraft
    });
    
    try {
      const response = await apiClient.post('/chapters', data);
      console.log('chaptersApi.createChapter - Success response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('chaptersApi.createChapter - Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        validationErrors: error.response?.data?.errors,
        errorMessage: error.response?.data?.message
      });
      
      // Log specific validation errors if available
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        Object.entries(error.response.data.errors).forEach(([field, message]) => {
          console.error(`- ${field}: ${message}`);
        });
      }
      
      throw error;
    }
  },

  // Get chapter by ID
  async getChapter(id: string): Promise<Chapter> {
    const response = await apiClient.get(`/chapters/${id}`);
    return response.data;
  },

  // Get chapter by story ID and chapter number
  async getChapterByStoryAndNumber(storyId: string, chapterNumber: number): Promise<Chapter> {
    const response = await apiClient.get(`/chapters/story/${storyId}/chapter/${chapterNumber}`);
    return response.data;
  },

  // Update chapter
  async updateChapter(id: string, data: UpdateChapterRequest): Promise<Chapter> {
    const response = await apiClient.put(`/chapters/${id}`, data);
    return response.data;
  },

  // Auto-save chapter (for rich text editor)
  async autoSaveChapter(id: string, data: UpdateChapterRequest): Promise<Chapter> {
    const response = await apiClient.put(`/chapters/${id}/autosave`, data);
    return response.data;
  },

  // Delete chapter
  async deleteChapter(id: string): Promise<void> {
    await apiClient.delete(`/chapters/${id}`);
  },

  // Get chapters by story
  async getChaptersByStory(storyId: string): Promise<ChapterPreview[]> {
    const response = await apiClient.get(`/chapters/story/${storyId}`);
    return response.data;
  },

  // Get chapters by story with pagination
  async getChaptersByStoryPaged(
    storyId: string, 
    params: { page?: number; size?: number } = {}
  ): Promise<{ content: ChapterPreview[]; totalPages: number; totalElements: number }> {
    const response = await apiClient.get(`/chapters/story/${storyId}/paged`, { params });
    return response.data;
  },

  // Chapter navigation
  async getNextChapter(chapterId: string): Promise<Chapter> {
    const response = await apiClient.get(`/chapters/${chapterId}/next`);
    return response.data;
  },

  async getPreviousChapter(chapterId: string): Promise<Chapter> {
    const response = await apiClient.get(`/chapters/${chapterId}/previous`);
    return response.data;
  },

  async getFirstChapter(storyId: string): Promise<Chapter> {
    const response = await apiClient.get(`/chapters/story/${storyId}/first`);
    return response.data;
  },

  async getLastChapter(storyId: string): Promise<Chapter> {
    const response = await apiClient.get(`/chapters/story/${storyId}/last`);
    return response.data;
  },

  // Chapter management
  async publishChapter(id: string): Promise<Chapter> {
    const response = await apiClient.post(`/chapters/${id}/publish`);
    return response.data;
  },

  async unpublishChapter(id: string): Promise<Chapter> {
    const response = await apiClient.post(`/chapters/${id}/unpublish`);
    return response.data;
  },

  // Reorder chapters
  async reorderChapters(storyId: string, chapterIds: string[]): Promise<void> {
    await apiClient.put(`/chapters/story/${storyId}/reorder`, chapterIds);
  },

  // Search chapters within story
  async searchChaptersInStory(storyId: string, query: string): Promise<ChapterPreview[]> {
    const response = await apiClient.get(`/chapters/story/${storyId}/search`, { 
      params: { q: query } 
    });
    return response.data;
  },
}; 