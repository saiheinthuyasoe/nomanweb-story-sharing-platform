import { apiClient } from "./client";

export interface BookmarkStatus {
  bookmarked: boolean;
  listTypes: {
    reading: boolean;
    completed: boolean;
    like: boolean;
    want_to_read: boolean;
  };
}

export interface BookmarkResponse {
  bookmarked: boolean;
  listType: string;
  message: string;
}

export interface LibraryItem {
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
  listType: "READING" | "COMPLETED" | "LIKE" | "WANT_TO_READ";
  addedAt: string;
}

export const libraryApi = {
  // Bookmark operations
  async toggleBookmark(
    storyId: string,
    listType: string = "LIKE"
  ): Promise<BookmarkResponse> {
    const response = await apiClient.post(
      `/libraries/story/${storyId}/bookmark`,
      null,
      {
        params: { listType },
      }
    );
    return response.data;
  },

  async getBookmarkStatus(storyId: string): Promise<BookmarkStatus> {
    const response = await apiClient.get(`/libraries/story/${storyId}/status`);
    return response.data;
  },

  // Library lists
  async getMyLibraries(listType?: string): Promise<LibraryItem[]> {
    const response = await apiClient.get("/libraries/my-lists", {
      params: listType ? { listType } : {},
    });
    return response.data;
  },

  async getUserLibraries(
    userId: string,
    listType?: string
  ): Promise<LibraryItem[]> {
    const response = await apiClient.get(`/libraries/user/${userId}/lists`, {
      params: listType ? { listType } : {},
    });
    return response.data;
  },

  // Reading status
  async updateReadingStatus(
    storyId: string,
    status: string
  ): Promise<{ message: string; status: string }> {
    const response = await apiClient.post(
      `/libraries/story/${storyId}/reading-status`,
      null,
      {
        params: { status },
      }
    );
    return response.data;
  },
};
