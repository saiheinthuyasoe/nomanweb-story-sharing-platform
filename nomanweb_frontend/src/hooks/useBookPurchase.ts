import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { monetizationApi, PurchaseBookRequest } from "@/lib/api/monetization";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

export const usePurchaseBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: monetizationApi.purchaseBook,
    onSuccess: (response) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["coinBalance"] });
      queryClient.invalidateQueries({ queryKey: ["purchaseHistory"] });
      queryClient.invalidateQueries({ queryKey: ["bookAccess"] });
      queryClient.invalidateQueries({ queryKey: ["purchasedStories"] });

      toast.success("Book purchased successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to purchase book");
    },
  });
};

export const useBookAccess = (storyId: string, storyUpdatedAt: string, enabled: boolean = true) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bookAccess", storyId, user?.id, storyUpdatedAt], // Include story updatedAt to force refetch on story change
    queryFn: async () => {
      if (!user) {
        console.log('🔍 No user authenticated, returning false for book access');
        return false;
      }
      try {
        console.log('🔍 Fetching book access for story:', storyId, 'user:', user.id);
        const result = await monetizationApi.canAccessBook(storyId);
        console.log('🔍 Book access result:', result);
        return result;
      } catch (error: any) {
        // If API call fails (e.g., authentication error), return false
        console.log('❌ Book access API call failed:', error.response?.data?.message || error.message);
        return false;
      }
    },
    enabled: enabled && !!storyId,
    staleTime: 0, // Always fetch fresh data - no cache for book access
    gcTime: 0, // No cache time - always fetch fresh data (updated from cacheTime)
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: false, // Don't retry failed requests to avoid showing stale data
    networkMode: 'always', // Always make network requests
  });
};
