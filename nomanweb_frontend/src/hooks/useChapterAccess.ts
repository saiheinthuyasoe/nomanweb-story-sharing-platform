import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { monetizationApi } from "@/lib/api/monetization";

export const useChapterAccess = (
  chapterId: string,
  enabled: boolean = true
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["chapter-access", chapterId],
    queryFn: async () => {
      if (!user) return false;
      return monetizationApi.canAccessChapter(chapterId);
    },
    enabled: enabled && !!chapterId && !!user,
    staleTime: 30 * 1000, // 30 seconds - shorter cache for real-time refund updates
  });
};

export const useChapterAccessBatch = (
  chapterIds: string[],
  enabled: boolean = true
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["chapter-access-batch", chapterIds],
    queryFn: async () => {
      if (!user || chapterIds.length === 0) return {};

      const accessPromises = chapterIds.map(async (chapterId) => {
        try {
          const hasAccess = await monetizationApi.canAccessChapter(chapterId);
          return { [chapterId]: hasAccess };
        } catch (error) {
          return { [chapterId]: false };
        }
      });

      const results = await Promise.all(accessPromises);
      return results.reduce((acc, result) => ({ ...acc, ...result }), {});
    },
    enabled: enabled && chapterIds.length > 0 && !!user,
    staleTime: 30 * 1000, // 30 seconds - shorter cache for real-time refund updates
  });
};
