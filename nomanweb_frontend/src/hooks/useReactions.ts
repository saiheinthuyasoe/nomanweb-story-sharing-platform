import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { reactionsApi, ReactionStatus, ReactionResponse } from '@/lib/api/reactions';

// Story reactions with real-time updates
export const useStoryReactionStatus = (storyId: string, enabled: boolean = true, realTime: boolean = true) => {
  return useQuery({
    queryKey: ['story-reaction', storyId],
    queryFn: () => reactionsApi.getStoryReactionStatus(storyId),
    enabled: enabled && !!storyId,
    // Real-time polling every 15 seconds (less frequent than comments)
    refetchInterval: realTime ? 15000 : false,
    // Refetch when window regains focus
    refetchOnWindowFocus: true,
    // Keep previous data while fetching
    placeholderData: (previousData) => previousData,
  });
};

export const useToggleStoryLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storyId: string) => reactionsApi.toggleStoryLike(storyId),
    // Optimistic update - immediately show like change
    onMutate: async (storyId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['story-reaction', storyId] });
      await queryClient.cancelQueries({ queryKey: ['story', storyId] });

      // Snapshot the previous values
      const previousReaction = queryClient.getQueryData(['story-reaction', storyId]);
      const previousStory = queryClient.getQueryData(['story', storyId]);

      // Optimistically update reaction status
      if (previousReaction) {
        const currentReaction = previousReaction as ReactionStatus;
        queryClient.setQueryData(['story-reaction', storyId], {
          liked: !currentReaction.liked,
          totalLikes: currentReaction.liked 
            ? (currentReaction.totalLikes || 1) - 1 
            : (currentReaction.totalLikes || 0) + 1,
        });
      }

      // Optimistically update story like count
      if (previousStory) {
        const currentStory = previousStory as any;
        queryClient.setQueryData(['story', storyId], {
          ...currentStory,
          totalLikes: previousReaction && (previousReaction as ReactionStatus).liked
            ? (currentStory.totalLikes || 1) - 1
            : (currentStory.totalLikes || 0) + 1,
        });
      }

      // Return context for rollback
      return { previousReaction, previousStory };
    },
    onSuccess: (data: ReactionResponse, storyId: string) => {
      // Update with actual server response
      queryClient.setQueryData(['story-reaction', storyId], {
        liked: data.liked,
        totalLikes: data.totalLikes,
      });
      
      // Invalidate story data to update like counts
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      
      toast.success(data.message);
    },
    onError: (error: any, storyId: string, context) => {
      // Rollback optimistic updates on error
      if (context?.previousReaction) {
        queryClient.setQueryData(['story-reaction', storyId], context.previousReaction);
      }
      if (context?.previousStory) {
        queryClient.setQueryData(['story', storyId], context.previousStory);
      }

      console.error('Like toggle error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update like';
      toast.error(errorMessage);
      
      // If it's an authentication error, log more details
      if (error.response?.status === 401) {
        console.error('Authentication failed when trying to like story');
        toast.error('Please log in to like stories');
      }
    },
    // Always refetch to ensure consistency
    onSettled: (data, error, storyId) => {
      queryClient.invalidateQueries({ queryKey: ['story-reaction', storyId] });
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
    },
  });
};

// Chapter reactions
export const useChapterReactionStatus = (chapterId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['chapter-reaction', chapterId],
    queryFn: () => reactionsApi.getChapterReactionStatus(chapterId),
    enabled: enabled && !!chapterId,
  });
};

export const useToggleChapterLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chapterId: string) => reactionsApi.toggleChapterLike(chapterId),
    onSuccess: (data: ReactionResponse, chapterId: string) => {
      // Update the reaction status in cache
      queryClient.setQueryData(['chapter-reaction', chapterId], {
        liked: data.liked,
        totalLikes: data.totalLikes,
      });
      
      // Invalidate chapter data to update like counts
      queryClient.invalidateQueries({ queryKey: ['chapter', chapterId] });
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update like');
    },
  });
}; 