import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { commentsApi, CreateCommentRequest, CreateReplyRequest, CommentResponse } from '@/lib/api/comments';
import { Comment } from '@/types/story';

// Get story comments with real-time updates
export const useStoryComments = (storyId: string, page: number = 0, size: number = 20, realTime: boolean = true) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['comments', 'story', storyId, page, size],
    queryFn: () => commentsApi.getStoryComments(storyId, page, size),
    enabled: !!storyId,
    // Real-time polling every 10 seconds
    refetchInterval: realTime ? 10000 : false,
    // Refetch when window regains focus
    refetchOnWindowFocus: true,
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData,
    // Notify when new comments are detected
    onSuccess: (newData, queryKey) => {
      const previousData = queryClient.getQueryData(['comments', 'story', storyId, page, size]);
      if (previousData && newData) {
        const prevCount = (previousData as any)?.totalElements || 0;
        const newCount = newData.totalElements || 0;
        if (newCount > prevCount && prevCount > 0) {
          toast.success(`${newCount - prevCount} new comment(s) detected!`);
        }
      }
    },
  });
};

// Get chapter comments with real-time updates
export const useChapterComments = (chapterId: string, page: number = 0, size: number = 20, realTime: boolean = true) => {
  return useQuery({
    queryKey: ['comments', 'chapter', chapterId, page, size],
    queryFn: () => commentsApi.getChapterComments(chapterId, page, size),
    enabled: !!chapterId,
    // Real-time polling every 10 seconds
    refetchInterval: realTime ? 10000 : false,
    // Refetch when window regains focus
    refetchOnWindowFocus: true,
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData,
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
        // Invalidate story query to update comment count
        queryClient.invalidateQueries({ queryKey: ['story', variables.storyId] });
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
      
      // Invalidate story queries to update comment counts
      queryClient.invalidateQueries({ queryKey: ['story'] });
      
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
      // Invalidate story queries to update comment counts
      queryClient.invalidateQueries({ queryKey: ['story'] });
      
      toast.success('Comment deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete comment');
    },
  });
};

// Toggle comment like with optimistic updates
export const useToggleCommentLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentsApi.toggleCommentLike(commentId),
    // Optimistic update - immediately update UI before server response
    onMutate: async (commentId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['comments'] });

      // Snapshot the previous value
      const previousComments = queryClient.getQueriesData({ queryKey: ['comments'] });

      // Optimistically update comment like count
      queryClient.setQueriesData({ queryKey: ['comments'] }, (old: any) => {
        if (!old) return old;
        
        // Handle paginated response
        if (old.content && Array.isArray(old.content)) {
          return {
            ...old,
            content: old.content.map((comment: any) => 
              comment.id === commentId 
                ? { ...comment, likes: (comment.likes || 0) + 1 }
                : comment
            )
          };
        }
        
        // Handle direct array response
        if (Array.isArray(old)) {
          return old.map((comment: any) => 
            comment.id === commentId 
              ? { ...comment, likes: (comment.likes || 0) + 1 }
              : comment
          );
        }
        
        return old;
      });

      // Return context with previous data for rollback
      return { previousComments };
    },
    onSuccess: (data, commentId) => {
      // Update with actual server response
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      
      toast.success(data.message);
    },
    onError: (error: any, commentId, context) => {
      // Rollback optimistic update on error
      if (context?.previousComments) {
        context.previousComments.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error(error.response?.data?.error || 'Failed to toggle like');
    },
    // Always refetch after error or success to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
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