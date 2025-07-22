import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { monetizationApi, PurchaseBookRequest } from "@/lib/api/monetization";
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

export const useBookAccess = (storyId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["bookAccess", storyId],
    queryFn: () => monetizationApi.canAccessBook(storyId),
    enabled: enabled && !!storyId,
    staleTime: 30 * 1000, // 30 seconds - shorter cache for real-time refund updates
  });
};
