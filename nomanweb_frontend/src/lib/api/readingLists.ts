import { apiClient } from './client';

export interface BookmarkStatus {
  bookmarked: boolean;
  listTypes: {
    reading: boolean;
    completed: boolean;
    favorite: boolean;
    want_to_read: boolean;
  };
}

export interface BookmarkResponse {
  bookmarked: boolean;
  listType: string;
  message: string;
}

export interface ReadingListItem {
  id: string;
  story: {
    id: string;
    title: string;
    author: {
      id: string;
      username: string;
      displayName?: string;
    };
    coverImageUrl?: string;
    totalChapters: number;
  };
  listType: 'READING' | 'COMPLETED' | 'FAVORITE' | 'WANT_TO_READ';
  addedAt: string;
}

export const readingListsApi = {
  // Bookmark operations
  async toggleBookmark(storyId: string, listType: string = 'FAVORITE'): Promise<BookmarkResponse> {
    const response = await apiClient.post(`/reading-lists/story/${storyId}/bookmark`, null, {
      params: { listType }
    });
    return response.data;
  },

  async getBookmarkStatus(storyId: string): Promise<BookmarkStatus> {
    const response = await apiClient.get(`/reading-lists/story/${storyId}/status`);
    return response.data;
  },

  // Reading lists
  async getMyReadingLists(listType?: string): Promise<ReadingListItem[]> {
    const response = await apiClient.get('/reading-lists/my-lists', {
      params: listType ? { listType } : {}
    });
    return response.data;
  },

  // Reading status
  async updateReadingStatus(storyId: string, status: string): Promise<{ message: string; status: string }> {
    const response = await apiClient.post(`/reading-lists/story/${storyId}/reading-status`, null, {
      params: { status }
    });
    return response.data;
  },
}; 