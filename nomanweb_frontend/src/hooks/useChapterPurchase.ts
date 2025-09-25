import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  monetizationApi,
  PurchaseChapterRequest,
} from "@/lib/api/monetization";
import { toast } from "react-hot-toast";

export const usePurchaseChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: monetizationApi.purchaseChapter,
    onSuccess: (response) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["coinBalance"] });
      queryClient.invalidateQueries({ queryKey: ["purchaseHistory"] });
      queryClient.invalidateQueries({ queryKey: ["chapter-access"] });
      queryClient.invalidateQueries({ queryKey: ["purchased-chapters"] });
      queryClient.invalidateQueries({ queryKey: ["bookAccess"] });

      toast.success("Chapter purchased successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to purchase chapter"
      );
    },
  });
};
