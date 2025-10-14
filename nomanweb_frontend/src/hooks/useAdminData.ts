import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminHomepageService, FeaturedContent, FeaturedContentStats, DashboardStats } from '@/services/adminHomepageService';
import { bookInsightsService, BookInsightsData } from '@/services/bookInsightsService';
import Cookies from 'js-cookie';

// Query Keys for Admin Data
export const adminQueryKeys = {
  // Homepage Management
  featuredContent: (section: string) => ['admin', 'featured-content', section] as const,
  featuredContentStats: () => ['admin', 'featured-content-stats'] as const,
  dashboardStats: () => ['admin', 'dashboard-stats'] as const,
  
  // Insights
  bookInsights: () => ['admin', 'book-insights'] as const,
  bookSections: (bookId: string) => ['admin', 'book-sections', bookId] as const,
  
  // Moderation
  moderationChapters: () => ['admin', 'moderation-chapters'] as const,
  moderationStats: () => ['admin', 'moderation-stats'] as const,
  queueStatus: () => ['admin', 'queue-status'] as const,
  feedbackSubmissions: () => ['admin', 'feedback-submissions'] as const,
} as const;

// Homepage Management Hooks
export const useFeaturedContent = (section: string) => {
  return useQuery({
    queryKey: adminQueryKeys.featuredContent(section),
    queryFn: () => adminHomepageService.getFeaturedContent(section),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: !!section,
  });
};

export const useFeaturedContentStats = () => {
  return useQuery({
    queryKey: adminQueryKeys.featuredContentStats(),
    queryFn: () => adminHomepageService.getFeaturedContentStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: adminQueryKeys.dashboardStats(),
    queryFn: () => adminHomepageService.getDashboardStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Book Insights Hooks
export const useBookInsights = () => {
  return useQuery({
    queryKey: adminQueryKeys.bookInsights(),
    queryFn: () => bookInsightsService.getBookInsightsDashboard(),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

export const useBookSections = (bookId: string) => {
  return useQuery({
    queryKey: adminQueryKeys.bookSections(bookId),
    queryFn: () => adminHomepageService.getBookSections(bookId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    enabled: !!bookId,
  });
};

export const useAllBookSections = (bookIds: string[]) => {
  return useQuery({
    queryKey: ['admin', 'all-book-sections', ...bookIds.sort()],
    queryFn: async () => {
      const sectionsMap: { [bookId: string]: string[] } = {};
      
      // Fetch sections for each book
      await Promise.all(
        bookIds.map(async (bookId) => {
          try {
            const sections = await adminHomepageService.getBookSections(bookId);
            sectionsMap[bookId] = sections;
          } catch (error) {
            console.warn(`Failed to fetch sections for book ${bookId}:`, error);
            sectionsMap[bookId] = [];
          }
        })
      );
      
      return sectionsMap;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    enabled: bookIds.length > 0,
  });
};

// Moderation Hooks
export const useModerationChapters = () => {
  return useQuery({
    queryKey: adminQueryKeys.moderationChapters(),
    queryFn: async () => {
      const adminToken = Cookies.get("adminToken");
      if (!adminToken) {
        throw new Error("No admin token found");
      }

      const response = await fetch("/api/admin/moderation/chapters", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch moderation chapters");
      }

      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute (more frequent for moderation)
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: true, // Refetch when focusing for real-time updates
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
  });
};

export const useModerationStats = () => {
  return useQuery({
    queryKey: adminQueryKeys.moderationStats(),
    queryFn: async () => {
      const adminToken = Cookies.get("adminToken");
      if (!adminToken) {
        throw new Error("No admin token found");
      }

      const response = await fetch("/api/admin/moderation/stats", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch moderation stats");
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useQueueStatus = () => {
  return useQuery({
    queryKey: adminQueryKeys.queueStatus(),
    queryFn: async () => {
      const adminToken = Cookies.get("adminToken");
      if (!adminToken) {
        throw new Error("No admin token found");
      }

      const response = await fetch("/api/admin/moderation/queue/status", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch queue status");
      }

      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds (very frequent for queue monitoring)
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
  });
};

export const useFeedbackSubmissions = () => {
  return useQuery({
    queryKey: adminQueryKeys.feedbackSubmissions(),
    queryFn: async () => {
      const adminToken = Cookies.get("adminToken");
      if (!adminToken) {
        throw new Error("No admin token found");
      }

      const response = await fetch("/api/admin/moderation/feedback", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feedback submissions");
      }

      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Mutation Hooks for Admin Actions
export const useAddToFeaturedContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ bookId, sectionType, duration }: { bookId: string; sectionType: string; duration?: number }) =>
      adminHomepageService.addToFeaturedContent(bookId, sectionType, duration),
    onSuccess: (_, { sectionType }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.featuredContent(sectionType) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.featuredContentStats() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboardStats() });
    },
  });
};

export const useModerateChapter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ chapterId, action, notes }: { chapterId: string; action: 'approve' | 'reject'; notes?: string }) => {
      const adminToken = Cookies.get("adminToken");
      if (!adminToken) {
        throw new Error("No admin token found");
      }

      const response = await fetch(`/api/admin/moderation/chapters/${chapterId}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} chapter`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate moderation-related queries
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.moderationChapters() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.moderationStats() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.queueStatus() });
    },
  });
};

// Cache invalidation helpers
export const useInvalidateAdminCache = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    invalidateFeaturedContent: (section?: string) => {
      if (section) {
        queryClient.invalidateQueries({ queryKey: adminQueryKeys.featuredContent(section) });
      } else {
        queryClient.invalidateQueries({ queryKey: ['admin', 'featured-content'] });
      }
    },
    invalidateModeration: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation-chapters'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'moderation-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'queue-status'] });
    },
    invalidateInsights: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.bookInsights() });
    },
  };
};