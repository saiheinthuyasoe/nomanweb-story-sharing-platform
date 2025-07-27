import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { monetizationApi } from "@/lib/api/monetization";

export const useChapterAccess = (
  chapterId: string,
  storyUpdatedAt: string,
  enabled: boolean = true
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["chapter-access", chapterId, storyUpdatedAt],
    queryFn: async () => {
      if (!user) return false;
      try {
        return await monetizationApi.canAccessChapter(chapterId);
      } catch (error: any) {
        // If API call fails (e.g., authentication error), return false
        console.log('Chapter access API call failed:', error.response?.data?.message || error.message);
        return false;
      }
    },
    enabled: enabled && !!chapterId && !!user,
    staleTime: 30 * 1000, // 30 seconds - shorter cache for real-time updates
    retry: false, // Don't retry failed requests to avoid showing stale data
  });
};

export const useChapterAccessBatch = (
  chapterIds: string[],
  storyUpdatedAt: string,
  enabled: boolean = true
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["chapter-access-batch", chapterIds, storyUpdatedAt],
    queryFn: async () => {
      if (!user || chapterIds.length === 0) return {};

      const accessPromises = chapterIds.map(async (chapterId) => {
        try {
          const hasAccess = await monetizationApi.canAccessChapter(chapterId);
          return { [chapterId]: hasAccess };
        } catch (error: any) {
          console.log('Chapter access API call failed for chapter', chapterId, ':', error.response?.data?.message || error.message);
          return { [chapterId]: false };
        }
      });

      const results = await Promise.all(accessPromises);
      return results.reduce((acc, result) => ({ ...acc, ...result }), {});
    },
    enabled: enabled && chapterIds.length > 0 && !!user,
    staleTime: 30 * 1000, // 30 seconds - shorter cache for real-time updates
    retry: false, // Don't retry failed requests to avoid showing stale data
  });
};
