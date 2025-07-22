import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { monetizationApi } from "@/lib/api/monetization";

interface PurchasedChapter {
  id: string;
  title: string;
  chapterNumber: number;
  coinPrice: number;
  purchasedAt: string;
  story: {
    id: string;
    title: string;
    coverImageUrl?: string;
    author: {
      id: string;
      username: string;
      displayName?: string;
    };
  };
}

export const usePurchasedChapters = (enabled: boolean = true) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["purchased-chapters"],
    queryFn: async (): Promise<PurchasedChapter[]> => {
      const data = await monetizationApi.getPurchaseHistory(0, 100);
      return data.content || [];
    },
    enabled: enabled && !!user,
    staleTime: 30 * 1000, // 30 seconds - shorter cache for real-time refund updates
  });
};
