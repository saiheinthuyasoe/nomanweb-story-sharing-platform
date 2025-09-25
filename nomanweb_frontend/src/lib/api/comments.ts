import { apiClient } from './client';
import { Comment } from '@/types/story';

export interface CommentResponse {
  content: Comment[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CreateCommentRequest {
  content: string;
  storyId?: string;
  chapterId?: string;
}

export interface CreateReplyRequest {
  content: string;
}

export interface CommentLikeResponse {
  liked: boolean;
  message: string;
}

export interface CommentStats {
  totalComments: number;
}

export const commentsApi = {
  // Create comment
  async createComment(data: CreateCommentRequest): Promise<Comment> {
    const response = await apiClient.post('/comments', data);
    return response.data;
  },

  // Create reply
  async createReply(parentCommentId: string, data: CreateReplyRequest): Promise<Comment> {
    const response = await apiClient.post(`/comments/${parentCommentId}/reply`, data);
    return response.data;
  },

  // Update comment
  async updateComment(commentId: string, content: string): Promise<Comment> {
    const response = await apiClient.put(`/comments/${commentId}`, { content });
    return response.data;
  },

  // Delete comment
  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/comments/${commentId}`);
  },

  // Get comment by ID
  async getComment(commentId: string): Promise<Comment> {
    const response = await apiClient.get(`/comments/${commentId}`);
    return response.data;
  },

  // Get story comments
  async getStoryComments(storyId: string, page: number = 0, size: number = 20): Promise<CommentResponse> {
    const response = await apiClient.get(`/comments/story/${storyId}`, {
      params: { page, size }
    });
    return response.data;
  },

  // Get chapter comments
  async getChapterComments(chapterId: string, page: number = 0, size: number = 20): Promise<CommentResponse> {
    const response = await apiClient.get(`/comments/chapter/${chapterId}`, {
      params: { page, size }
    });
    return response.data;
  },

  // Get comment replies
  async getCommentReplies(parentCommentId: string): Promise<Comment[]> {
    const response = await apiClient.get(`/comments/${parentCommentId}/replies`);
    return response.data;
  },

  // Get user comments
  async getUserComments(userId: string, page: number = 0, size: number = 20): Promise<CommentResponse> {
    const response = await apiClient.get(`/comments/user/${userId}`, {
      params: { page, size }
    });
    return response.data;
  },

  // Toggle comment like
  async toggleCommentLike(commentId: string): Promise<CommentLikeResponse> {
    const response = await apiClient.post(`/comments/${commentId}/like`);
    return response.data;
  },

  // Pin comment
  async pinComment(commentId: string): Promise<Comment> {
    const response = await apiClient.post(`/comments/${commentId}/pin`);
    return response.data;
  },

  // Unpin comment
  async unpinComment(commentId: string): Promise<Comment> {
    const response = await apiClient.delete(`/comments/${commentId}/pin`);
    return response.data;
  },

  // Flag comment
  async flagComment(commentId: string, reason: string): Promise<Comment> {
    const response = await apiClient.post(`/comments/${commentId}/flag`, { reason });
    return response.data;
  },

  // Get pinned comments
  async getPinnedComments(storyId?: string, chapterId?: string): Promise<Comment[]> {
    const params: any = {};
    if (storyId) params.storyId = storyId;
    if (chapterId) params.chapterId = chapterId;
    
    const response = await apiClient.get('/comments/pinned', { params });
    return response.data;
  },

  // Get latest comments
  async getLatestComments(page: number = 0, size: number = 20): Promise<CommentResponse> {
    const response = await apiClient.get('/comments/latest', {
      params: { page, size }
    });
    return response.data;
  },

  // Get comment stats
  async getCommentStats(userId?: string, storyId?: string, chapterId?: string): Promise<CommentStats> {
    const params: any = {};
    if (userId) params.userId = userId;
    if (storyId) params.storyId = storyId;
    if (chapterId) params.chapterId = chapterId;
    
    const response = await apiClient.get('/comments/stats', { params });
    return response.data;
  },

  // Admin functions
  async getPendingComments(page: number = 0, size: number = 20): Promise<CommentResponse> {
    const response = await apiClient.get('/comments/pending', {
      params: { page, size }
    });
    return response.data;
  },

  async approveComment(commentId: string): Promise<Comment> {
    const response = await apiClient.post(`/comments/${commentId}/approve`);
    return response.data;
  },

  async rejectComment(commentId: string, reason: string): Promise<Comment> {
    const response = await apiClient.post(`/comments/${commentId}/reject`, { reason });
    return response.data;
  }
}; 