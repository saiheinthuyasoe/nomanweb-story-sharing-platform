import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

// Types
export interface RevenueAnalytics {
  totalEarnings: number;
  monthlyEarnings: number;
  totalGiftsReceived: number;
  totalGiftsSent: number;
  totalPurchases: number;
  averageMonthlyRevenue: number;
  topEarningStory?: {
    id: string;
    title: string;
    earnings: number;
  };
}

export interface GiftTransaction {
  id: string;
  gift: {
    id: string;
    name: string;
    iconUrl: string;
    coinCost: number;
  };
  sender?: {
    id: string;
    username: string;
    displayName?: string;
  };
  recipient?: {
    id: string;
    username: string;
    displayName?: string;
  };
  totalCoins: number;
  message?: string;
  createdAt: string;
  story?: {
    id: string;
    title: string;
  };
  chapter?: {
    id: string;
    title: string;
    chapterNumber: number;
  };
}

export interface EarnedMoney {
  id: string;
  transactionType: string;
  amount: number;
  readerName: string;
  readerUsername: string;
  storyTitle: string;
  chapterTitle?: string;
  chapterNumber?: number;
  createdAt: string;
  commission: number;
  netEarnings: number;
}

export interface PurchaseHistory {
  id: string;
  purchaseType: string;
  storyId: string;
  storyTitle: string;
  storyAuthor: string;
  chapterId?: string;
  chapterTitle?: string;
  chapterNumber?: number;
  amount: number;
  purchasedAt: string;
}

export interface RefundEarned {
  id: string;
  transactionType: string;
  amount: number;
  reason: string;
  processedAt: string;
  originalPurchaseDate: string;
  storyTitle: string;
  chapterTitle?: string;
  chapterNumber?: number;
}

export interface RefundPaid {
  id: string;
  transactionType: string;
  amount: number;
  reason: string;
  processedAt: string;
  originalPurchaseDate: string;
  storyTitle: string;
  chapterTitle?: string;
  chapterNumber?: number;
  readerName: string;
}

export interface BulkMonetizationData {
  analytics: RevenueAnalytics;
  receivedGifts: {
    content: GiftTransaction[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
  sentGifts: {
    content: GiftTransaction[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
  earnedMoney: {
    content: EarnedMoney[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
  purchaseHistory: {
    content: GiftTransaction[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
  refundsEarned: {
    content: RefundEarned[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
  refundsPaid: {
    content: RefundPaid[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
  coinBalance: number;
}

// Query keys
export const monetizationKeys = {
  all: ['monetization'] as const,
  revenue: () => [...monetizationKeys.all, 'revenue'] as const,
  balance: () => [...monetizationKeys.all, 'balance'] as const,
  giftsReceived: (page: number, size: number) => [...monetizationKeys.all, 'gifts', 'received', page, size] as const,
  giftsSent: (page: number, size: number) => [...monetizationKeys.all, 'gifts', 'sent', page, size] as const,
  earnings: (page: number, size: number) => [...monetizationKeys.all, 'earnings', page, size] as const,
  purchases: (page: number, size: number) => [...monetizationKeys.all, 'purchases', page, size] as const,
  refundsEarned: (page: number, size: number) => [...monetizationKeys.all, 'refunds', 'earned', page, size] as const,
  refundsPaid: (page: number, size: number) => [...monetizationKeys.all, 'refunds', 'paid', page, size] as const,
  bulk: (page: number, size: number) => [...monetizationKeys.all, 'bulk', page, size] as const,
};

// Hook for revenue analytics
export const useRevenueAnalytics = () => {
  return useQuery({
    queryKey: monetizationKeys.revenue(),
    queryFn: async (): Promise<RevenueAnalytics> => {
      const response = await apiClient.get('/monetization/revenue');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for coin balance
export const useCoinBalance = () => {
  return useQuery({
    queryKey: monetizationKeys.balance(),
    queryFn: async (): Promise<number> => {
      const response = await apiClient.get('/monetization/balance');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: true, // Refetch balance when window gains focus
  });
};

// Hook for received gifts
export const useReceivedGifts = (page: number = 0, size: number = 10) => {
  return useQuery({
    queryKey: monetizationKeys.giftsReceived(page, size),
    queryFn: async () => {
      const response = await apiClient.get(`/monetization/gifts/received?page=${page}&size=${size}`);
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for sent gifts
export const useSentGifts = (page: number = 0, size: number = 10) => {
  return useQuery({
    queryKey: monetizationKeys.giftsSent(page, size),
    queryFn: async () => {
      const response = await apiClient.get(`/monetization/gifts/sent?page=${page}&size=${size}`);
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for earnings
export const useEarnings = (page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: monetizationKeys.earnings(page, size),
    queryFn: async () => {
      const response = await apiClient.get(`/monetization/earnings?page=${page}&size=${size}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for purchase history
export const usePurchaseHistory = (page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: monetizationKeys.purchases(page, size),
    queryFn: async () => {
      const response = await apiClient.get(`/monetization/purchases?page=${page}&size=${size}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for refunds earned
export const useRefundsEarned = (page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: monetizationKeys.refundsEarned(page, size),
    queryFn: async () => {
      const response = await apiClient.get(`/monetization/refunds/earned?page=${page}&size=${size}`);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (refunds change less frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for refunds paid
export const useRefundsPaid = (page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: monetizationKeys.refundsPaid(page, size),
    queryFn: async () => {
      const response = await apiClient.get(`/monetization/refunds/paid?page=${page}&size=${size}`);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (refunds change less frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for bulk monetization data (single API call for all data)
export const useBulkMonetizationData = (page: number = 0, size: number = 10) => {
  return useQuery({
    queryKey: monetizationKeys.bulk(page, size),
    queryFn: async (): Promise<BulkMonetizationData> => {
      const response = await apiClient.get(`/monetization/bulk?page=${page}&size=${size}`);
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes (shorter since it's comprehensive)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Composite hook for all monetization data
export const useMonetizationData = () => {
  const revenueQuery = useRevenueAnalytics();
  const balanceQuery = useCoinBalance();
  const receivedGiftsQuery = useReceivedGifts();
  const sentGiftsQuery = useSentGifts();
  const earningsQuery = useEarnings();
  const purchaseHistoryQuery = usePurchaseHistory();
  const refundsEarnedQuery = useRefundsEarned();
  const refundsPaidQuery = useRefundsPaid();

  const isLoading = 
    revenueQuery.isLoading ||
    balanceQuery.isLoading ||
    receivedGiftsQuery.isLoading ||
    sentGiftsQuery.isLoading ||
    earningsQuery.isLoading ||
    purchaseHistoryQuery.isLoading ||
    refundsEarnedQuery.isLoading ||
    refundsPaidQuery.isLoading;

  const isError = 
    revenueQuery.isError ||
    balanceQuery.isError ||
    receivedGiftsQuery.isError ||
    sentGiftsQuery.isError ||
    earningsQuery.isError ||
    purchaseHistoryQuery.isError ||
    refundsEarnedQuery.isError ||
    refundsPaidQuery.isError;

  const error = 
    revenueQuery.error ||
    balanceQuery.error ||
    receivedGiftsQuery.error ||
    sentGiftsQuery.error ||
    earningsQuery.error ||
    purchaseHistoryQuery.error ||
    refundsEarnedQuery.error ||
    refundsPaidQuery.error;

  return {
    // Data
    analytics: revenueQuery.data,
    coinBalance: balanceQuery.data,
    receivedGifts: receivedGiftsQuery.data?.content || [],
    sentGifts: sentGiftsQuery.data?.content || [],
    earnedMoney: earningsQuery.data?.content || [],
    purchaseHistory: purchaseHistoryQuery.data?.content || [],
    refundsEarned: refundsEarnedQuery.data?.content || [],
    refundsPaid: refundsPaidQuery.data?.content || [],
    
    // Loading states
    isLoading,
    isError,
    error,
    
    // Individual loading states for granular control
    loadingStates: {
      revenue: revenueQuery.isLoading,
      balance: balanceQuery.isLoading,
      receivedGifts: receivedGiftsQuery.isLoading,
      sentGifts: sentGiftsQuery.isLoading,
      earnings: earningsQuery.isLoading,
      purchaseHistory: purchaseHistoryQuery.isLoading,
      refundsEarned: refundsEarnedQuery.isLoading,
      refundsPaid: refundsPaidQuery.isLoading,
    },
    
    // Refetch functions
    refetch: {
      revenue: revenueQuery.refetch,
      balance: balanceQuery.refetch,
      receivedGifts: receivedGiftsQuery.refetch,
      sentGifts: sentGiftsQuery.refetch,
      earnings: earningsQuery.refetch,
      purchaseHistory: purchaseHistoryQuery.refetch,
      refundsEarned: refundsEarnedQuery.refetch,
      refundsPaid: refundsPaidQuery.refetch,
    },
  };
};

// Utility hook to invalidate all monetization queries
export const useInvalidateMonetization = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: monetizationKeys.all }),
    invalidateRevenue: () => queryClient.invalidateQueries({ queryKey: monetizationKeys.revenue() }),
    invalidateBalance: () => queryClient.invalidateQueries({ queryKey: monetizationKeys.balance() }),
    invalidateGifts: () => queryClient.invalidateQueries({ queryKey: [...monetizationKeys.all, 'gifts'] }),
    invalidateEarnings: () => queryClient.invalidateQueries({ queryKey: [...monetizationKeys.all, 'earnings'] }),
    invalidatePurchases: () => queryClient.invalidateQueries({ queryKey: [...monetizationKeys.all, 'purchases'] }),
    invalidateRefunds: () => queryClient.invalidateQueries({ queryKey: [...monetizationKeys.all, 'refunds'] }),
    invalidateBulk: () => queryClient.invalidateQueries({ queryKey: [...monetizationKeys.all, 'bulk'] }),
  };
};