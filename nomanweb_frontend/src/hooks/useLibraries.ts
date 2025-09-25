import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { libraryApi, BookmarkStatus, BookmarkResponse, LibraryItem } from '@/lib/api/libraries';

// Bookmark status
export const useBookmarkStatus = (storyId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['bookmark-status', storyId],
    queryFn: () => libraryApi.getBookmarkStatus(storyId),
    enabled: enabled && !!storyId,
  });
};

// Toggle bookmark
export const useToggleBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, listType }: { storyId: string; listType?: string }) => 
      libraryApi.toggleBookmark(storyId, listType),
    onSuccess: (data: BookmarkResponse, variables) => {
      // Invalidate bookmark status
      queryClient.invalidateQueries({ queryKey: ['bookmark-status', variables.storyId] });
      
      // Invalidate library lists
      queryClient.invalidateQueries({ queryKey: ['libraries'] });
      
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update bookmark');
    },
  });
};

// Library lists
export const useMyLibraries = (listType?: string) => {
  return useQuery({
    queryKey: ['libraries', listType],
    queryFn: () => libraryApi.getMyLibraries(listType),
  });
};

// Update reading status
export const useUpdateReadingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, status }: { storyId: string; status: string }) => 
      libraryApi.updateReadingStatus(storyId, status),
    onSuccess: (data, variables) => {
      // Invalidate bookmark status
      queryClient.invalidateQueries({ queryKey: ['bookmark-status', variables.storyId] });
      
      // Invalidate library lists
      queryClient.invalidateQueries({ queryKey: ['libraries'] });
      
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update reading status');
    },
  });
};

// Convenience hooks for specific list types
export const useLikedStories = () => useMyLibraries('LIKE');
export const useCurrentlyReading = () => useMyLibraries('READING');
export const useCompletedStories = () => useMyLibraries('COMPLETED');
export const useWantToReadStories = () => useMyLibraries('WANT_TO_READ');
export const usePurchasedStories = () => useMyLibraries('PURCHASED');
export const useHistoryStories = () => useMyLibraries('HISTORY');