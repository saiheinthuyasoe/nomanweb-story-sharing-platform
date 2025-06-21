import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { readingListsApi, BookmarkStatus, BookmarkResponse, ReadingListItem } from '@/lib/api/readingLists';

// Bookmark status
export const useBookmarkStatus = (storyId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['bookmark-status', storyId],
    queryFn: () => readingListsApi.getBookmarkStatus(storyId),
    enabled: enabled && !!storyId,
  });
};

// Toggle bookmark
export const useToggleBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, listType }: { storyId: string; listType?: string }) => 
      readingListsApi.toggleBookmark(storyId, listType),
    onSuccess: (data: BookmarkResponse, variables) => {
      // Invalidate bookmark status
      queryClient.invalidateQueries({ queryKey: ['bookmark-status', variables.storyId] });
      
      // Invalidate reading lists
      queryClient.invalidateQueries({ queryKey: ['reading-lists'] });
      
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update bookmark');
    },
  });
};

// Reading lists
export const useMyReadingLists = (listType?: string) => {
  return useQuery({
    queryKey: ['reading-lists', listType],
    queryFn: () => readingListsApi.getMyReadingLists(listType),
  });
};

// Update reading status
export const useUpdateReadingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, status }: { storyId: string; status: string }) => 
      readingListsApi.updateReadingStatus(storyId, status),
    onSuccess: (data, variables) => {
      // Invalidate bookmark status
      queryClient.invalidateQueries({ queryKey: ['bookmark-status', variables.storyId] });
      
      // Invalidate reading lists
      queryClient.invalidateQueries({ queryKey: ['reading-lists'] });
      
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update reading status');
    },
  });
};

// Convenience hooks for specific list types
export const useFavoriteStories = () => useMyReadingLists('FAVORITE');
export const useCurrentlyReading = () => useMyReadingLists('READING');
export const useCompletedStories = () => useMyReadingLists('COMPLETED');
export const useWantToReadStories = () => useMyReadingLists('WANT_TO_READ'); 