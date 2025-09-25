import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ratingsApi, StoryRatingStatsResponse, UserRatingResponse, RatingsPageResponse } from '@/lib/api/ratings';

// Get story rating statistics
export const useStoryRatingStats = (storyId: string) => {
  return useQuery({
    queryKey: ['ratings', 'stats', storyId],
    queryFn: () => ratingsApi.getStoryRatingStats(storyId),
    enabled: !!storyId,
    // Refetch when window regains focus
    refetchOnWindowFocus: true,
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
};

// Get current user's rating for a story
export const useUserRating = (storyId: string) => {
  return useQuery({
    queryKey: ['ratings', 'user', storyId],
    queryFn: () => ratingsApi.getUserRating(storyId),
    enabled: !!storyId,
    // Refetch when window regains focus
    refetchOnWindowFocus: true,
    // Cache for 2 minutes
    staleTime: 2 * 60 * 1000,
  });
};

// Get all ratings for a story (paginated)
export const useStoryRatings = (
  storyId: string,
  page: number = 0,
  size: number = 20,
  sortBy: string = 'createdAt',
  sortDir: string = 'desc'
) => {
  return useQuery({
    queryKey: ['ratings', 'story', storyId, page, size, sortBy, sortDir],
    queryFn: () => ratingsApi.getStoryRatings(storyId, page, size, sortBy, sortDir),
    enabled: !!storyId,
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData,
  });
};

// Get all ratings by a user
export const useUserRatings = (userId: string) => {
  return useQuery({
    queryKey: ['ratings', 'user', userId],
    queryFn: () => ratingsApi.getUserRatings(userId),
    enabled: !!userId,
  });
};

// Rate a story (create or update)
export const useRateStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, rating }: { storyId: string; rating: number }) =>
      ratingsApi.rateStory(storyId, rating),
    onSuccess: (data, variables) => {
      const { storyId } = variables;
      
      // Show success message
      toast.success(data.message);
      
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['ratings', 'stats', storyId] });
      queryClient.invalidateQueries({ queryKey: ['ratings', 'user', storyId] });
      queryClient.invalidateQueries({ queryKey: ['ratings', 'story', storyId] });
      
      // Update the user rating cache immediately
      queryClient.setQueryData(['ratings', 'user', storyId], (oldData: UserRatingResponse | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            hasRated: true,
            rating: data.userRating || null,
            updatedAt: new Date().toISOString(),
          };
        }
        return oldData;
      });
      
      // Update the stats cache immediately if available
      if (data.stats) {
        queryClient.setQueryData(['ratings', 'stats', storyId], data.stats);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to submit rating';
      toast.error(message);
    },
  });
};

// Delete user's rating
export const useDeleteRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storyId: string) => ratingsApi.deleteRating(storyId),
    onSuccess: (data, storyId) => {
      // Show success message
      toast.success(data.message);
      
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['ratings', 'stats', storyId] });
      queryClient.invalidateQueries({ queryKey: ['ratings', 'user', storyId] });
      queryClient.invalidateQueries({ queryKey: ['ratings', 'story', storyId] });
      
      // Update the user rating cache immediately
      queryClient.setQueryData(['ratings', 'user', storyId], (oldData: UserRatingResponse | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            hasRated: false,
            rating: null,
            createdAt: undefined,
            updatedAt: undefined,
          };
        }
        return oldData;
      });
      
      // Update the stats cache immediately if available
      if (data.stats) {
        queryClient.setQueryData(['ratings', 'stats', storyId], data.stats);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete rating';
      toast.error(message);
    },
  });
};

// Combined hook for rating operations
export const useRatingOperations = (storyId: string) => {
  const rateStory = useRateStory();
  const deleteRating = useDeleteRating();
  const userRating = useUserRating(storyId);
  const ratingStats = useStoryRatingStats(storyId);

  const handleRating = (rating: number) => {
    rateStory.mutate({ storyId, rating });
  };

  const handleDeleteRating = () => {
    deleteRating.mutate(storyId);
  };

  return {
    // Data
    userRating: userRating.data,
    ratingStats: ratingStats.data,
    
    // Loading states
    isLoadingUserRating: userRating.isLoading,
    isLoadingStats: ratingStats.isLoading,
    isSubmitting: rateStory.isPending || deleteRating.isPending,
    
    // Actions
    handleRating,
    handleDeleteRating,
    
    // Utilities
    canRate: userRating.data?.canRate ?? false,
    hasRated: userRating.data?.hasRated ?? false,
    currentRating: userRating.data?.rating ?? null,
    averageRating: ratingStats.data?.averageRating ?? null,
    totalRatings: ratingStats.data?.totalRatings ?? 0,
    ratingDistribution: ratingStats.data?.ratingDistribution ?? {},
  };
};