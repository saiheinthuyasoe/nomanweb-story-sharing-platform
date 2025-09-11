import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  storiesApi,
  categoriesApi,
  GetStoriesParams,
  SearchStoriesParams,
} from "@/lib/api/stories";
import {
  CreateStoryRequest,
  UpdateStoryRequest,
  Story,
  StoryPreview,
} from "@/types/story";
import { toast } from "react-hot-toast";

// Story queries
export const useStories = (params: GetStoriesParams = {}) => {
  return useQuery({
    queryKey: ["stories", params],
    queryFn: () => storiesApi.getStories(params),
  });
};

export const useStory = (id: string, enabled: boolean = true) => {
  console.log("🔍 useStory called with id:", id, "enabled:", enabled);

  const query = useQuery({
    queryKey: ["story", id],
    queryFn: () => {
      console.log("📡 Calling storiesApi.getStory with id:", id);
      return storiesApi.getStory(id);
    },
    enabled: !!id && enabled,
  });

  // Handle success/error with useEffect (React Query v5 approach)
  useEffect(() => {
    if (query.data) {
      console.log("✅ useStory success - data received:", query.data);
    }
  }, [query.data]);

  useEffect(() => {
    if (query.error) {
      console.error("❌ useStory error:", query.error);
    }
  }, [query.error]);

  return query;
};

export const useMyStories = (params: { page?: number; size?: number } = {}) => {
  return useQuery({
    queryKey: ["my-stories", params],
    queryFn: () => storiesApi.getMyStories(params),
  });
};

export const useMyStoriesIncludingDeleted = (
  params: { page?: number; size?: number } = {}
) => {
  return useQuery({
    queryKey: ["my-stories-all", params],
    queryFn: () => {
      console.log(
        "📚 Fetching all stories including deleted with params:",
        params
      );
      return storiesApi.getMyStoriesIncludingDeleted(params);
    },
    onSuccess: (data) => {
      console.log("📚 Successfully fetched all stories including deleted:", {
        totalStories: data.content?.length || 0,
        deletedStories: data.content?.filter((s) => s.isDeleted).length || 0,
      });
    },
    onError: (error) => {
      console.error("❌ Failed to fetch all stories including deleted:", error);
    },
  });
};

export const useStoriesByAuthor = (
  authorId: string,
  params: { page?: number; size?: number } = {}
) => {
  return useQuery({
    queryKey: ["stories-by-author", authorId, params],
    queryFn: () => storiesApi.getStoriesByAuthor(authorId, params),
    enabled: !!authorId,
  });
};

export const useStoriesByCategory = (
  categoryId: string,
  params: { page?: number; size?: number } = {}
) => {
  return useQuery({
    queryKey: ["stories-by-category", categoryId, params],
    queryFn: () => storiesApi.getStoriesByCategory(categoryId, params),
    enabled: !!categoryId,
  });
};

export const useSearchStories = (params: SearchStoriesParams) => {
  return useQuery({
    queryKey: ["search-stories", params],
    queryFn: () => storiesApi.searchStories(params),
    enabled: !!params.query,
  });
};

export const useTrendingStories = (
  params: { page?: number; size?: number } = {}
) => {
  return useQuery({
    queryKey: ["trending-stories", params],
    queryFn: () => storiesApi.getTrendingStories(params),
  });
};

export const useFeaturedStories = (
  params: { page?: number; size?: number } = {}
) => {
  return useQuery({
    queryKey: ["featured-stories", params],
    queryFn: () => storiesApi.getFeaturedStories(params),
  });
};

export const useCanAccessStory = (id: string) => {
  return useQuery({
    queryKey: ["can-access-story", id],
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
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["my-stories"] });
      toast.success("Story created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create story");
    },
  });
};

export const useUpdateStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoryRequest }) =>
      storiesApi.updateStory(id, data),
    onSuccess: (updatedStory, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["story", id] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["my-stories"] });
      toast.success("Story updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update story");
    },
  });
};

export const useDeleteStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storiesApi.deleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["my-stories"] });
      queryClient.invalidateQueries({ queryKey: ["my-stories-all"] });
      toast.success("Story moved to trash successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete story");
    },
  });
};

export const useMoveStoryToTrash = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      console.log("🔄 Moving story to trash:", id);
      return storiesApi.moveStoryToTrash(id);
    },
    onSuccess: (data, storyId) => {
      console.log("✅ Story moved to trash successfully:", storyId);
      console.log("🔄 Invalidating queries...");

      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["my-stories"] });
      queryClient.invalidateQueries({ queryKey: ["my-stories-all"] });

      // Force refetch the trash data
      queryClient.refetchQueries({ queryKey: ["my-stories-all"] });

      console.log("✅ Queries invalidated and refetched");
      toast.success("Story moved to trash successfully!");
    },
    onError: (error: any, storyId) => {
      console.error("❌ Failed to move story to trash:", storyId, error);
      const errorData = error.response?.data as any;
      toast.error(errorData?.message || "Failed to move story to trash");
    },
  });
};

export const useRestoreStoryFromTrash = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storiesApi.restoreStoryFromTrash(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["my-stories"] });
      queryClient.invalidateQueries({ queryKey: ["my-stories-all"] });
      toast.success("Story restored successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to restore story");
    },
  });
};

export const usePermanentlyDeleteStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storiesApi.permanentlyDeleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["my-stories"] });
      queryClient.invalidateQueries({ queryKey: ["my-stories-all"] });
      toast.success("Story permanently deleted!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to permanently delete story"
      );
    },
  });
};

export const usePublishStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storiesApi.publishStory(id),
    onSuccess: (publishedStory) => {
      queryClient.invalidateQueries({ queryKey: ["story", publishedStory.id] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["my-stories"] });

      // Invalidate book access cache - crucial for republish after refunds
      queryClient.invalidateQueries({
        queryKey: ["bookAccess", publishedStory.id],
      });

      // Invalidate all chapter access caches for this story's chapters
      queryClient.invalidateQueries({
        queryKey: ["chapter-access"],
        predicate: (query) => {
          return query.queryKey[0] === "chapter-access";
        },
      });

      // Invalidate batch chapter access queries
      queryClient.invalidateQueries({
        queryKey: ["chapter-access-batch"],
      });

      // Also invalidate purchase history and coin balance in case of republish
      queryClient.invalidateQueries({ queryKey: ["purchaseHistory"] });
      queryClient.invalidateQueries({ queryKey: ["coinBalance"] });

      toast.success("Story published successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to publish story");
    },
  });
};

export const useUnpublishStory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storiesApi.unpublishStory(id),
    onSuccess: (unpublishedStory) => {
      queryClient.invalidateQueries({
        queryKey: ["story", unpublishedStory.id],
      });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["my-stories"] });

      // Add these new invalidations:
      // Invalidate book access cache
      queryClient.invalidateQueries({
        queryKey: ["bookAccess", unpublishedStory.id],
      });

      // Invalidate all chapter access caches for this story's chapters
      queryClient.invalidateQueries({
        queryKey: ["chapter-access"],
        predicate: (query) => {
          return query.queryKey[0] === "chapter-access";
        },
      });

      // Invalidate batch chapter access queries
      queryClient.invalidateQueries({
        queryKey: ["chapter-access-batch"],
      });

      toast.success("Story unpublished successfully!");
    },
    onError: (error: any) => {
      const errorData = error.response?.data;

      if (errorData?.refundCheckRequired) {
        // Don't show error toast for refund check required - let UI handle it
        return;
      } else if (errorData?.insufficientCoins) {
        toast.error(
          `Cannot unpublish story: ${
            errorData.message || "Insufficient coins to process refunds"
          }`
        );
      } else if (errorData?.requiresRefunds) {
        toast.error(
          `Cannot unpublish story: ${
            errorData.message || "Refunds required but cannot be processed"
          }`
        );
      } else {
        toast.error(errorData?.message || "Failed to unpublish story");
      }
    },
  });
};

// Category hooks
export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getCategories(),
  });
};

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: ["category", id],
    queryFn: () => categoriesApi.getCategory(id),
    enabled: !!id,
  });
};

// View tracking
export const useIncrementStoryView = () => {
  return useMutation({
    mutationFn: (id: string) => storiesApi.incrementStoryView(id),
    // Don't show toast notifications for view tracking
  });
};

// Earnings management
export const useRecalculateStoryEarnings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storiesApi.recalculateStoryEarnings(id),
    onSuccess: (data, storyId) => {
      // Invalidate and refetch story data to update the earnings display
      queryClient.invalidateQueries({ queryKey: ["story", storyId] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });

      toast.success(
        `Story earnings recalculated successfully! New total: ${data.newEarnings} coins`
      );
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Failed to recalculate story earnings"
      );
    },
  });
};
