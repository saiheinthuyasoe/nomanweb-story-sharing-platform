import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

interface GiftTransaction {
  id: string;
  gift: {
    id: string;
    name: string;
    iconUrl: string;
    coinCost: number;
  } | null;
  sender: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string;
  };
  recipient: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string;
  };
  totalCoins: number;
  message: string;
  createdAt: string;
}

// Since there's no specific endpoint for getting a single gift transaction,
// we'll fetch from received gifts and find the specific transaction
export const useGiftTransaction = (transactionId: string | null) => {
  return useQuery({
    queryKey: ["giftTransaction", transactionId],
    queryFn: async (): Promise<GiftTransaction | null> => {
      if (!transactionId) return null;

      // Fetch received gifts and find the specific transaction
      // We'll fetch a larger page size to increase chances of finding the transaction
      const response = await apiClient.get("/monetization/gifts/received", {
        params: { page: 0, size: 100 },
      });

      const transactions = response.data.content;
      const transaction = transactions.find(
        (t: GiftTransaction) => t.id === transactionId
      );

      return transaction || null;
    },
    enabled: !!transactionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
