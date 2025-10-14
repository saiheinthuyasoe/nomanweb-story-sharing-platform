import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";

interface CoinBalanceUpdate {
  type: "balance_update";
  userId: string;
  newBalance: number;
  timestamp: string;
}

export function useCoinBalanceRealtime() {
  console.log("🎯 useCoinBalanceRealtime hook initialized at:", new Date().toISOString());
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  console.log("🔍 AuthContext user:", user);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    console.log("🔄 useCoinBalanceRealtime hook triggered");
    console.log("👤 Current user:", user);

    if (!user) {
      console.log("❌ No user found, skipping balance SSE connection");
      return;
    }

    console.log("🔗 Setting up balance SSE connection for user:", user.id);

    const connectToSSE = async (retryCount = 0) => {
      try {
        let token = Cookies.get("token");
        if (!token) {
          console.log("❌ No token found in cookies, skipping SSE connection");
          return;
        }

        // Check if token is close to expiring (within 2 minutes) and refresh proactively
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
          const currentTime = Date.now();
          const timeUntilExpiry = expirationTime - currentTime;
          
          console.log("🕐 Token expires in:", Math.round(timeUntilExpiry / 1000), "seconds");
          
          // If token expires within 2 minutes, refresh it proactively
          if (timeUntilExpiry < 120000) { // 2 minutes
            console.log("🔄 Token expires soon, refreshing proactively...");
            
            const refreshToken = Cookies.get("refreshToken");
            if (refreshToken) {
              const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
              const refreshResponse = await fetch(`${backendUrl}/auth/refresh`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
              });

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                
                // Update cookies with new tokens
                Cookies.set("token", refreshData.token, {
                  expires: 7,
                  path: "/",
                  secure: false,
                  sameSite: "strict",
                });
                Cookies.set("refreshToken", refreshData.refreshToken, {
                  expires: 7,
                  path: "/",
                  secure: false,
                  sameSite: "strict",
                });

                token = refreshData.token; // Use the new token
                console.log("✅ Token refreshed proactively for SSE connection");
              } else {
                console.warn("⚠️ Proactive token refresh failed, continuing with current token");
              }
            }
          }
        } catch (tokenParseError) {
          console.warn("⚠️ Could not parse token for expiry check:", tokenParseError);
        }

        // Cancel existing connection if any
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // Connect to backend SSE endpoint with authentication
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
        const response = await fetch(
          `${backendUrl}/coins/sse/balance-updates`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "text/event-stream",
              "Cache-Control": "no-cache",
            },
            signal: abortController.signal,
          }
        );

        if (!response.ok) {
          console.error(
            `❌ SSE connection failed: ${response.status} ${response.statusText}`
          );
          
          // Handle authentication errors (401/403) by attempting token refresh
          if ((response.status === 401 || response.status === 403) && retryCount < 2) {
            console.log("🔄 SSE authentication failed, attempting token refresh...");
            
            try {
              const refreshToken = Cookies.get("refreshToken");
              if (!refreshToken) {
                console.error("❌ No refresh token available for SSE reconnection");
                throw new Error("No refresh token available");
              }

              // Attempt to refresh the token
              const refreshResponse = await fetch(`${backendUrl}/auth/refresh`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
              });

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                
                // Update cookies with new tokens
                Cookies.set("token", refreshData.token, {
                  expires: 7,
                  path: "/",
                  secure: false,
                  sameSite: "strict",
                });
                Cookies.set("refreshToken", refreshData.refreshToken, {
                  expires: 7,
                  path: "/",
                  secure: false,
                  sameSite: "strict",
                });

                console.log("✅ Token refreshed successfully for SSE, retrying connection...");
                
                // Retry the SSE connection with the new token
                setTimeout(() => connectToSSE(retryCount + 1), 1000);
                return;
              } else {
                console.error("❌ Token refresh failed for SSE:", refreshResponse.status);
              }
            } catch (refreshError) {
              console.error("❌ Error during SSE token refresh:", refreshError);
            }
          }
          
          throw new Error(`SSE connection failed: ${response.status}`);
        }

        console.log("✅ Connected to coin balance updates SSE (Backend) at:", new Date().toISOString());

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No readable stream available");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = '';

        const processStream = async () => {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log("🔚 SSE stream ended");
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.trim() === '') continue;

              console.log("📨 Raw SSE line received:", line);

              if (line.startsWith('event:')) {
                currentEvent = line.slice(6);
                console.log("🎯 SSE event type:", currentEvent);
              } else if (line.startsWith('data:')) {
                const data = line.slice(5);
                console.log("📦 SSE data payload:", data);
                
                if (data === 'connected' || currentEvent === 'connected') {
                  console.log("✅ SSE connection established");
                } else if (currentEvent === 'balance_update') {
                  try {
                    const update: CoinBalanceUpdate = JSON.parse(data);
                    console.log("💰 Balance update received:", update);
                    console.log("🔍 Current user ID:", user.id, "(type:", typeof user.id, ")");
                    console.log("🔍 Update user ID:", update.userId, "(type:", typeof update.userId, ")");

                    // Only update if this is for the current user
                    if (update.userId === user.id || update.userId === String(user.id)) {
                      const updateStartTime = new Date().toISOString();
                      console.log("✅ Processing balance update for current user from", user.coinBalance, "to", update.newBalance, "at:", updateStartTime);

                      // Update user's coin balance in context immediately
                      updateUser({ coinBalance: update.newBalance });

                      // Force immediate query data update without network request
                      queryClient.setQueryData(['coin-balance'], update.newBalance);
                      
                      // Trigger component re-renders by invalidating queries
                      await queryClient.invalidateQueries({ queryKey: ['coin-balance'] });

                      const updateCompleteTime = new Date().toISOString();
                      console.log(`💰 Balance updated successfully: ${update.newBalance} coins at:`, updateCompleteTime);
                      console.log("⚡ Update processing time (ms):", new Date(updateCompleteTime).getTime() - new Date(updateStartTime).getTime());
                    } else {
                      console.log("❌ Balance update for different user:", update.userId, "vs", user.id);
                    }
                  } catch (error) {
                    console.error("❌ Error parsing SSE data:", error, "Raw data:", data);
                  }
                } else if (currentEvent === 'heartbeat') {
                  console.log("💓 Heartbeat received:", data);
                } else {
                  console.log("❓ Unknown event type:", currentEvent, "with data:", data);
                }
              }
            }
          }
        };

        await processStream();
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("🔄 SSE connection aborted");
        } else {
          console.error("❌ SSE connection error:", error);

          // Attempt to reconnect after a delay
          setTimeout(connectToSSE, 5000);
        }
      }
    };

    console.log("🔄 Setting up SSE connection for user:", user.id);
    connectToSSE();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        console.log("🧹 Cleaning up SSE connection");
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [user, updateUser, queryClient]);

  return null; // This hook doesn't return anything, it just manages the SSE connection
}
