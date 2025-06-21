import { apiClient } from './client';

export interface ReadingProgressData {
  progressPercentage: number;
  isCompleted: boolean;
  lastReadAt?: string;
  hasProgress: boolean;
}

export interface StoryProgressData {
  progressList: ReadingProgressItem[];
  currentChapter?: {
    id: string;
    title: string;
    chapterNumber: number;
  };
  lastReadAt?: string;
  overallProgress: number;
  completedChapters: number;
  totalChapters: number;
}

export interface ReadingProgressItem {
  id: string;
  progressPercentage: number;
  isCompleted: boolean;
  lastReadAt: string;
  chapter: {
    id: string;
    title: string;
    chapterNumber: number;
  };
  story: {
    id: string;
    title: string;
    author: {
      id: string;
      username: string;
      displayName?: string;
    };
  };
}

export interface UpdateProgressResponse {
  progressPercentage: number;
  isCompleted: boolean;
  lastReadAt: string;
  message: string;
}

export const readingProgressApi = {
  // Update reading progress
  async updateProgress(chapterId: string, progressPercentage: number): Promise<UpdateProgressResponse> {
    const response = await apiClient.post(`/reading-progress/chapter/${chapterId}/update`, null, {
      params: { progressPercentage }
    });
    return response.data;
  },

  // Get story progress
  async getStoryProgress(storyId: string): Promise<StoryProgressData> {
    const response = await apiClient.get(`/reading-progress/story/${storyId}`);
    return response.data;
  },

  // Get chapter progress
  async getChapterProgress(chapterId: string): Promise<ReadingProgressData> {
    const response = await apiClient.get(`/reading-progress/chapter/${chapterId}`);
    return response.data;
  },

  // Get my reading progress
  async getMyReadingProgress(page: number = 0, size: number = 20): Promise<{ content: ReadingProgressItem[]; totalElements: number }> {
    const response = await apiClient.get('/reading-progress/my-progress', {
      params: { page, size }
    });
    return response.data;
  },
}; 