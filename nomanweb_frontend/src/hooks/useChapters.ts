import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { chaptersApi, CreateChapterRequest, UpdateChapterRequest, Chapter, ChapterPreview } from '@/lib/api/chapters';

// Get chapter by ID
export const useChapter = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['chapter', id],
    queryFn: () => chaptersApi.getChapter(id),
    enabled: enabled && !!id,
  });
};

// Get chapter by story and chapter number
export const useChapterByStoryAndNumber = (storyId: string, chapterNumber: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['chapter', storyId, chapterNumber],
    queryFn: () => chaptersApi.getChapterByStoryAndNumber(storyId, chapterNumber),
    enabled: enabled && !!storyId && !!chapterNumber,
  });
};

// Get chapters by story
export const useChaptersByStory = (storyId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['chapters', storyId],
    queryFn: () => chaptersApi.getChaptersByStory(storyId),
    enabled: enabled && !!storyId,
  });
};

// Get chapters by story with pagination
export const useChaptersByStoryPaged = (
  storyId: string, 
  params: { page?: number; size?: number } = {},
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['chapters-paged', storyId, params],
    queryFn: () => chaptersApi.getChaptersByStoryPaged(storyId, params),
    enabled: enabled && !!storyId,
  });
};

// Chapter navigation hooks
export const useFirstChapter = (storyId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['chapter-first', storyId],
    queryFn: () => chaptersApi.getFirstChapter(storyId),
    enabled: enabled && !!storyId,
  });
};

export const useLastChapter = (storyId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['chapter-last', storyId],
    queryFn: () => chaptersApi.getLastChapter(storyId),
    enabled: enabled && !!storyId,
  });
};

export const useNextChapter = (chapterId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['chapter-next', chapterId],
    queryFn: () => chaptersApi.getNextChapter(chapterId),
    enabled: enabled && !!chapterId,
  });
};

export const usePreviousChapter = (chapterId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['chapter-previous', chapterId],
    queryFn: () => chaptersApi.getPreviousChapter(chapterId),
    enabled: enabled && !!chapterId,
  });
};

// Search chapters in story
export const useSearchChaptersInStory = (storyId: string, query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['chapters-search', storyId, query],
    queryFn: () => chaptersApi.searchChaptersInStory(storyId, query),
    enabled: enabled && !!storyId && !!query,
  });
};

// Chapter mutations
export const useCreateChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChapterRequest) => chaptersApi.createChapter(data),
    onSuccess: (newChapter, variables) => {
      // Invalidate chapters for the story
      queryClient.invalidateQueries({ queryKey: ['chapters', variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ['chapters-paged', variables.storyId] });
      
      // Update story data (chapter count might have changed)
      queryClient.invalidateQueries({ queryKey: ['story', variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['my-stories'] });
      
      toast.success('Chapter created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create chapter');
    },
  });
};

export const useUpdateChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChapterRequest }) => 
      chaptersApi.updateChapter(id, data),
    onSuccess: (updatedChapter, variables) => {
      // Update the specific chapter in cache (by ID)
      queryClient.setQueryData(['chapter', variables.id], updatedChapter);
      
      // Also update the chapter cache by story and chapter number (used by edit page)
      queryClient.setQueryData(['chapter', updatedChapter.story.id, updatedChapter.chapterNumber], updatedChapter);
      
      // Invalidate all related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['chapter'] });
      queryClient.invalidateQueries({ queryKey: ['chapters', updatedChapter.story.id] });
      queryClient.invalidateQueries({ queryKey: ['chapters-paged', updatedChapter.story.id] });
      
      // Also invalidate story data in case chapter count or other story metrics changed
      queryClient.invalidateQueries({ queryKey: ['story', updatedChapter.story.id] });
      
      if (!variables.data.isAutoSave) {
        toast.success('Chapter updated successfully!');
      }
    },
    onError: (error: any, variables) => {
      if (!variables.data.isAutoSave) {
        toast.error(error.response?.data?.message || 'Failed to update chapter');
      }
    },
  });
};

export const useAutoSaveChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChapterRequest }) => 
      chaptersApi.autoSaveChapter(id, data),
    onSuccess: (updatedChapter, variables) => {
      // Update the specific chapter in cache (by ID)
      queryClient.setQueryData(['chapter', variables.id], updatedChapter);
      
      // Also update the chapter cache by story and chapter number (used by edit page)
      queryClient.setQueryData(['chapter', updatedChapter.story.id, updatedChapter.chapterNumber], updatedChapter);
      
      // For auto-save, we don't need to invalidate all queries, just update the specific ones
      queryClient.invalidateQueries({ queryKey: ['chapters', updatedChapter.story.id] });
    },
    onError: () => {
      // Silent failure for auto-save
    },
  });
};

export const useDeleteChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chaptersApi.deleteChapter(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache and invalidate related queries
      queryClient.removeQueries({ queryKey: ['chapter', deletedId] });
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['chapters-paged'] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['my-stories'] });
      
      toast.success('Chapter deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete chapter');
    },
  });
};

export const usePublishChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chaptersApi.publishChapter(id),
    onSuccess: (publishedChapter, id) => {
      // Update the chapter in cache
      queryClient.setQueryData(['chapter', id], publishedChapter);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['chapters', publishedChapter.story.id] });
      queryClient.invalidateQueries({ queryKey: ['chapters-paged', publishedChapter.story.id] });
      
      toast.success('Chapter published successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to publish chapter');
    },
  });
};

export const useUnpublishChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chaptersApi.unpublishChapter(id),
    onSuccess: (unpublishedChapter, id) => {
      // Update the chapter in cache
      queryClient.setQueryData(['chapter', id], unpublishedChapter);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['chapters', unpublishedChapter.story.id] });
      queryClient.invalidateQueries({ queryKey: ['chapters-paged', unpublishedChapter.story.id] });
      
      toast.success('Chapter unpublished successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unpublish chapter');
    },
  });
};

export const useReorderChapters = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, chapterIds }: { storyId: string; chapterIds: string[] }) => 
      chaptersApi.reorderChapters(storyId, chapterIds),
    onSuccess: (_, variables) => {
      // Invalidate chapters for the story
      queryClient.invalidateQueries({ queryKey: ['chapters', variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ['chapters-paged', variables.storyId] });
      
      toast.success('Chapters reordered successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reorder chapters');
    },
  });
}; 