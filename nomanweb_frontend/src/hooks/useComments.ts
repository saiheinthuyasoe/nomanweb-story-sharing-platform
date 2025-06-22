import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { commentsApi, CreateCommentRequest, CreateReplyRequest, CommentResponse } from '@/lib/api/comments';
import { Comment } from '@/types/story';

// Get story comments
export const useStoryComments = (storyId: string, page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: ['comments', 'story', storyId, page, size],
    queryFn: () => commentsApi.getStoryComments(storyId, page, size),
    enabled: !!storyId,
  });
};

// Get chapter comments
export const useChapterComments = (chapterId: string, page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: ['comments', 'chapter', chapterId, page, size],
    queryFn: () => commentsApi.getChapterComments(chapterId, page, size),
    enabled: !!chapterId,
  });
};

// Get comment replies
export const useCommentReplies = (parentCommentId: string) => {
  return useQuery({
    queryKey: ['comments', 'replies', parentCommentId],
    queryFn: () => commentsApi.getCommentReplies(parentCommentId),
    enabled: !!parentCommentId,
  });
};

// Get user comments
export const useUserComments = (userId: string, page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: ['comments', 'user', userId, page, size],
    queryFn: () => commentsApi.getUserComments(userId, page, size),
    enabled: !!userId,
  });
};

// Get pinned comments
export const usePinnedComments = (storyId?: string, chapterId?: string) => {
  return useQuery({
    queryKey: ['comments', 'pinned', storyId, chapterId],
    queryFn: () => commentsApi.getPinnedComments(storyId, chapterId),
    enabled: !!(storyId || chapterId),
  });
};

// Get latest comments
export const useLatestComments = (page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: ['comments', 'latest', page, size],
    queryFn: () => commentsApi.getLatestComments(page, size),
  });
};

// Get comment stats
export const useCommentStats = (userId?: string, storyId?: string, chapterId?: string) => {
  return useQuery({
    queryKey: ['comments', 'stats', userId, storyId, chapterId],
    queryFn: () => commentsApi.getCommentStats(userId, storyId, chapterId),
    enabled: !!(userId || storyId || chapterId),
  });
};

// Create comment
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => commentsApi.createComment(data),
    onSuccess: (newComment, variables) => {
      // Invalidate relevant comment queries
      if (variables.storyId) {
        queryClient.invalidateQueries({ queryKey: ['comments', 'story', variables.storyId] });
      }
      if (variables.chapterId) {
        queryClient.invalidateQueries({ queryKey: ['comments', 'chapter', variables.chapterId] });
      }
      
      // Invalidate comment stats
      queryClient.invalidateQueries({ queryKey: ['comments', 'stats'] });
      
      toast.success('Comment posted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to post comment');
    },
  });
};

// Create reply
export const useCreateReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ parentCommentId, data }: { parentCommentId: string; data: CreateReplyRequest }) => 
      commentsApi.createReply(parentCommentId, data),
    onSuccess: (newReply, variables) => {
      // Invalidate replies for the parent comment
      queryClient.invalidateQueries({ queryKey: ['comments', 'replies', variables.parentCommentId] });
      
      // Invalidate story/chapter comments to update counts
      queryClient.invalidateQueries({ queryKey: ['comments', 'story'] });
      queryClient.invalidateQueries({ queryKey: ['comments', 'chapter'] });
      
      toast.success('Reply posted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to post reply');
    },
  });
};

// Update comment
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => 
      commentsApi.updateComment(commentId, content),
    onSuccess: (updatedComment) => {
      // Invalidate all comment queries to refresh the updated comment
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      
      toast.success('Comment updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update comment');
    },
  });
};

// Delete comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentsApi.deleteComment(commentId),
    onSuccess: () => {
      // Invalidate all comment queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      
      toast.success('Comment deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete comment');
    },
  });
};

// Toggle comment like
export const useToggleCommentLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentsApi.toggleCommentLike(commentId),
    onSuccess: (data, commentId) => {
      // Invalidate comment queries to update like counts
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to toggle like');
    },
  });
};

// Pin comment
export const usePinComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentsApi.pinComment(commentId),
    onSuccess: () => {
      // Invalidate comment queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      
      toast.success('Comment pinned successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to pin comment');
    },
  });
};

// Unpin comment
export const useUnpinComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentsApi.unpinComment(commentId),
    onSuccess: () => {
      // Invalidate comment queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      
      toast.success('Comment unpinned successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to unpin comment');
    },
  });
};

// Flag comment
export const useFlagComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, reason }: { commentId: string; reason: string }) => 
      commentsApi.flagComment(commentId, reason),
    onSuccess: () => {
      // Invalidate comment queries
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      
      toast.success('Comment flagged for moderation');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to flag comment');
    },
  });
};

// Admin hooks
export const usePendingComments = (page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: ['comments', 'pending', page, size],
    queryFn: () => commentsApi.getPendingComments(page, size),
  });
};

export const useApproveComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentsApi.approveComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('Comment approved');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve comment');
    },
  });
};

export const useRejectComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, reason }: { commentId: string; reason: string }) => 
      commentsApi.rejectComment(commentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('Comment rejected');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reject comment');
    },
  });
}; 