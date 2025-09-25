import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { monetizationApi } from "@/lib/api/monetization";

export const useCoinBalance = (enabled: boolean = true) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["coin-balance"],
    queryFn: () => monetizationApi.getCoinBalance(),
    enabled: enabled && !!user,
    staleTime: 0, // Always consider data stale for immediate updates
    gcTime: 0, // Don't cache data - always fetch fresh data when invalidated
    refetchOnWindowFocus: false, // Disable to prevent unnecessary refetches
    refetchOnMount: true, // Enable initial fetch to populate data
    refetchInterval: false, // Disable automatic refetching since we use SSE
    refetchIntervalInBackground: false,
    notifyOnChangeProps: ["data"], // Only notify when data changes for better performance
    initialData: user?.coinBalance, // Use user context balance as initial data
  });
};
