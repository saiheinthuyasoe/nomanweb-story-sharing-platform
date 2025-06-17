import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storiesApi, categoriesApi, GetStoriesParams, SearchStoriesParams } from '@/lib/api/stories';
import { CreateStoryRequest, UpdateStoryRequest, Story, StoryPreview } from '@/types/story';
import { toast } from 'react-hot-toast';

// Story queries
export const useStories = (params: GetStoriesParams = {}) => {
  return useQuery({
    queryKey: ['stories', params],
    queryFn: () => storiesApi.getStories(params),
  });
};

export const useStory = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['story', id],
    queryFn: () => storiesApi.getStory(id),
    enabled: enabled && !!id,
  });
};

export const useMyStories = (params: { page?: number; size?: number } = {}) => {
  return useQuery({
    queryKey: ['my-stories', params],
    queryFn: () => storiesApi.getMyStories(params),
  });
};

export const useStoriesByAuthor = (
  authorId: string, 
  params: { page?: number; size?: number } = {}
) => {
  return useQuery({
    queryKey: ['stories-by-author', authorId, params],
    queryFn: () => storiesApi.getStoriesByAuthor(authorId, params),
    enabled: !!authorId,
  });
};

export const useStoriesByCategory = (
  categoryId: string, 
  params: { page?: number; size?: number } = {}
) => {
  return useQuery({
    queryKey: ['stories-by-category', categoryId, params],
    queryFn: () => storiesApi.getStoriesByCategory(categoryId, params),
    enabled: !!categoryId,
  });
};

export const useSearchStories = (params: SearchStoriesParams) => {
  return useQuery({
    queryKey: ['search-stories', params],
    queryFn: () => storiesApi.searchStories(params),
    enabled: !!params.query,
  });
};

export const useTrendingStories = (params: { page?: number; size?: number } = {}) => {
  return useQuery({
    queryKey: ['trending-stories', params],
    queryFn: () => storiesApi.getTrendingStories(params),
  });
};

export const useFeaturedStories = (params: { page?: number; size?: number } = {}) => {
  return useQuery({
    queryKey: ['featured-stories', params],
    queryFn: () => storiesApi.getFeaturedStories(params),
  });
};

export const useCanAccessStory = (id: string) => {
  return useQuery({
    queryKey: ['can-access-story', id],
    queryFn: () => storiesApi.canUserAccessStory(id),
    enabled: !!id,
  });
};

// Story mutations
export const useCreateStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStoryRequest) => storiesApi.createStory(data),
    onSuccess: (newStory) => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['my-stories'] });
      toast.success('Story created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create story');
    },
  });
};

export const useUpdateStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoryRequest }) => 
      storiesApi.updateStory(id, data),
    onSuccess: (updatedStory, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['story', id] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['my-stories'] });
      toast.success('Story updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update story');
    },
  });
};

export const useDeleteStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storiesApi.deleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['my-stories'] });
      toast.success('Story deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete story');
    },
  });
};

export const usePublishStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storiesApi.publishStory(id),
    onSuccess: (publishedStory) => {
      queryClient.invalidateQueries({ queryKey: ['story', publishedStory.id] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['my-stories'] });
      toast.success('Story published successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to publish story');
    },
  });
};

export const useUnpublishStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storiesApi.unpublishStory(id),
    onSuccess: (unpublishedStory) => {
      queryClient.invalidateQueries({ queryKey: ['story', unpublishedStory.id] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['my-stories'] });
      toast.success('Story unpublished successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unpublish story');
    },
  });
};

// Category hooks
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories(),
  });
};

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => categoriesApi.getCategory(id),
    enabled: !!id,
  });
}; 