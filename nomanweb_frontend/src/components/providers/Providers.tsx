"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "@/contexts/AuthContext";
import { RealtimeProvider } from "./RealtimeProvider";
import { useState, useEffect } from "react";
import { setQueryClient } from "@/lib/api/client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - reasonable for longer tokens
            gcTime: 10 * 60 * 1000, // 10 minutes cache time
            retry: (failureCount, error: any) => {
              // Don't retry on 401/403 errors (authentication issues)
              if (
                error?.response?.status === 401 ||
                error?.response?.status === 403
              ) {
                return false;
              }
              // Retry other errors up to 2 times
              return failureCount < 2;
            },
            refetchOnWindowFocus: true, // Refetch when window regains focus
            refetchOnMount: true, // Always refetch when component mounts
            refetchOnReconnect: true, // Refetch when network reconnects
          },
          mutations: {
            retry: (failureCount, error: any) => {
              // Don't retry mutations on auth errors
              if (
                error?.response?.status === 401 ||
                error?.response?.status === 403
              ) {
                return false;
              }
              return failureCount < 1;
            },
          },
        },
      })
  );

  // Set the query client reference for API client
  useEffect(() => {
    setQueryClient(queryClient);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>{children}</RealtimeProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
