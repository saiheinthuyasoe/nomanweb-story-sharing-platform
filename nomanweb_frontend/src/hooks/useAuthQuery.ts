import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { tokenRefreshEvents } from "@/contexts/AuthContext";

interface UseAuthQueryOptions<TData, TError>
  extends Omit<UseQueryOptions<TData, TError>, "retry"> {
  // Add any additional options specific to auth queries
}

export function useAuthQuery<TData, TError = unknown>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: UseAuthQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const queryClient = useQueryClient();

  // Subscribe to token refresh events to invalidate queries
  useEffect(() => {
    const unsubscribe = tokenRefreshEvents.subscribe((token, refreshToken) => {
      console.log("🔄 Invalidating queries due to token refresh");
      // Invalidate all queries when tokens are refreshed
      queryClient.invalidateQueries();
    });

    return unsubscribe;
  }, [queryClient]);

  return useQuery({
    ...options,
    queryKey,
    queryFn,
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for auth-sensitive queries
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
