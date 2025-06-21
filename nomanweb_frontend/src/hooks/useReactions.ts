import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { reactionsApi, ReactionStatus, ReactionResponse } from '@/lib/api/reactions';

// Story reactions
export const useStoryReactionStatus = (storyId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['story-reaction', storyId],
    queryFn: () => reactionsApi.getStoryReactionStatus(storyId),
    enabled: enabled && !!storyId,
  });
};

export const useToggleStoryLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storyId: string) => reactionsApi.toggleStoryLike(storyId),
    onSuccess: (data: ReactionResponse, storyId: string) => {
      // Update the reaction status in cache
      queryClient.setQueryData(['story-reaction', storyId], {
        liked: data.liked,
        totalLikes: data.totalLikes,
      });
      
      // Invalidate story data to update like counts
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update like');
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