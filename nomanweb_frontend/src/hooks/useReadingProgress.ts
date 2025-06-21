import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { readingProgressApi, ReadingProgressData, StoryProgressData, UpdateProgressResponse } from '@/lib/api/readingProgress';

// Chapter progress
export const useChapterProgress = (chapterId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['reading-progress', 'chapter', chapterId],
    queryFn: () => readingProgressApi.getChapterProgress(chapterId),
    enabled: enabled && !!chapterId,
  });
};

// Story progress
export const useStoryProgress = (storyId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['reading-progress', 'story', storyId],
    queryFn: () => readingProgressApi.getStoryProgress(storyId),
    enabled: enabled && !!storyId,
  });
};

// My reading progress
export const useMyReadingProgress = (page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: ['reading-progress', 'my-progress', page, size],
    queryFn: () => readingProgressApi.getMyReadingProgress(page, size),
  });
};

// Update progress
export const useUpdateReadingProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chapterId, progressPercentage }: { chapterId: string; progressPercentage: number }) => {
      // Validate inputs before making API call
      if (!chapterId || progressPercentage < 0 || progressPercentage > 100) {
        throw new Error('Invalid chapter ID or progress percentage');
      }
      return readingProgressApi.updateProgress(chapterId, progressPercentage);
    },
    onSuccess: (data: UpdateProgressResponse, variables) => {
      // Update chapter progress cache
      queryClient.setQueryData(['reading-progress', 'chapter', variables.chapterId], {
        progressPercentage: data.progressPercentage,
        isCompleted: data.isCompleted,
        lastReadAt: data.lastReadAt,
        hasProgress: true,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['reading-progress', 'story'] });
      queryClient.invalidateQueries({ queryKey: ['reading-progress', 'my-progress'] });
      queryClient.invalidateQueries({ queryKey: ['chapter', variables.chapterId] });
      
      // Only show toast for completed chapters to avoid spam
      if (data.isCompleted) {
        toast.success('Chapter completed!');
      }
    },
    onError: (error: any) => {
      console.error('Failed to update reading progress:', error);
      
      // If it's an authentication error, don't retry
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('User not authenticated for reading progress tracking');
        return;
      }
      
      // Don't show error toast as this is called frequently during reading
    },
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors or client errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        return false;
      }
      // Only retry server errors up to 2 times
      return failureCount < 2;
    },
  });
};

// Auto-update progress hook for reading pages
export const useAutoUpdateProgress = (chapterId: string) => {
  const updateProgress = useUpdateReadingProgress();
  const [lastUpdatedProgress, setLastUpdatedProgress] = useState(0);
  
  const updateProgressThrottled = useCallback((progressPercentage: number) => {
    // Only update if progress is significant (every 5%) and different from last update
    const roundedProgress = Math.floor(progressPercentage / 5) * 5;
    
    if (roundedProgress > 0 && roundedProgress !== lastUpdatedProgress && chapterId) {
      setLastUpdatedProgress(roundedProgress);
      updateProgress.mutate({ chapterId, progressPercentage: roundedProgress });
    }
  }, [chapterId, updateProgress, lastUpdatedProgress]);

  return updateProgressThrottled;
}; 