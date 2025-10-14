import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import { useAuth } from "@/contexts/AuthContext";
import { Notification } from "@/types/user";

interface NotificationRealtimeOptions {
  onNewNotification?: (notification: Notification) => void;
  onNotificationRead?: (notificationId: string) => void;
  onAllNotificationsRead?: () => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const useNotificationsRealtime = (
  options: NotificationRealtimeOptions = {}
) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const {
    onNewNotification,
    onNotificationRead,
    onAllNotificationsRead,
    onConnectionChange,
  } = options;

  useEffect(() => {
    if (!user) {
      console.log("❌ No user found, skipping notification SSE connection");
      return;
    }

    const connectToSSE = async (retryCount = 0) => {
      try {
        let token = Cookies.get("token");
        if (!token) {
          console.log(
            "❌ No token found in cookies, skipping notification SSE connection"
          );
          return;
        }

        // Check if token is close to expiring (within 2 minutes) and refresh proactively
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
          const currentTime = Date.now();
          const timeUntilExpiry = expirationTime - currentTime;
          
          console.log("🕐 Notification SSE token expires in:", Math.round(timeUntilExpiry / 1000), "seconds");
          
          // If token expires within 2 minutes, refresh it proactively
          if (timeUntilExpiry < 120000) { // 2 minutes
            console.log("🔄 Notification SSE token expires soon, refreshing proactively...");
            
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
                console.log("✅ Notification SSE token refreshed proactively");
              } else {
                console.warn("⚠️ Proactive notification SSE token refresh failed, continuing with current token");
              }
            }
          }
        } catch (tokenParseError) {
          console.warn("⚠️ Could not parse notification SSE token for expiry check:", tokenParseError);
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
          `${backendUrl}/notifications/sse/updates`,
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
            `❌ Notification SSE connection failed: ${response.status} ${response.statusText}`
          );
          
          // Handle authentication errors (401/403) by attempting token refresh
          if ((response.status === 401 || response.status === 403) && retryCount < 2) {
            console.log("🔄 Notification SSE authentication failed, attempting token refresh...");
            
            try {
              const refreshToken = Cookies.get("refreshToken");
              if (!refreshToken) {
                console.error("❌ No refresh token available for notification SSE reconnection");
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

                console.log("✅ Token refreshed successfully for notification SSE, retrying connection...");
                
                // Retry the SSE connection with the new token
                setTimeout(() => connectToSSE(retryCount + 1), 1000);
                return;
              } else {
                console.error("❌ Token refresh failed for notification SSE:", refreshResponse.status);
              }
            } catch (refreshError) {
              console.error("❌ Error during notification SSE token refresh:", refreshError);
            }
          }
          
          throw new Error(
            `Notification SSE connection failed: ${response.status}`
          );
        }

        console.log("✅ Connected to notification updates SSE");
        onConnectionChange?.(true);

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No readable stream available");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("🔌 Notification SSE stream ended");
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              const eventType = line.substring(7);
              const dataLine = lines[lines.indexOf(line) + 1];

              if (dataLine && dataLine.startsWith("data: ")) {
                const data = dataLine.substring(6);

                try {
                  if (eventType === "connected") {
                    const parsedData = JSON.parse(data);
                    console.log("✅ Notification SSE connected:", parsedData);
                  } else if (eventType === "notification_update") {
                    const update = JSON.parse(data);
                    console.log("📨 Received notification update:", update);

                    // Check if this update is for the current user
                    if (
                      update.userId === user.id ||
                      update.userId === String(user.id)
                    ) {
                      switch (update.type) {
                        case "new_notification":
                          console.log(
                            "📨 New notification received:",
                            update.data
                          );
                          onNewNotification?.(update.data);

                          // Invalidate queries to show the new notification
                          queryClient.invalidateQueries({
                            queryKey: ["notifications"],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["unreadNotifications"],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["unreadCount"],
                          });
                          break;

                        case "notification_read":
                          console.log(
                            "✅ Notification marked as read:",
                            update.data.notificationId
                          );
                          onNotificationRead?.(update.data.notificationId);

                          // Invalidate queries to update read status
                          queryClient.invalidateQueries({
                            queryKey: ["notifications"],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["unreadNotifications"],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["unreadCount"],
                          });
                          break;

                        case "all_notifications_read":
                          console.log("✅ All notifications marked as read");
                          onAllNotificationsRead?.();

                          // Invalidate queries to update all read statuses
                          queryClient.invalidateQueries({
                            queryKey: ["notifications"],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["unreadNotifications"],
                          });
                          queryClient.invalidateQueries({
                            queryKey: ["unreadCount"],
                          });
                          break;

                        default:
                          console.log(
                            "Unknown notification update type:",
                            update.type
                          );
                      }
                    }
                  }
                } catch (error) {
                  console.error(
                    "❌ Error parsing notification SSE data:",
                    error
                  );
                }
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("🔄 Notification SSE connection aborted");
        } else {
          console.error("❌ Notification SSE connection error:", error);
          onConnectionChange?.(false);

          // Attempt to reconnect after a delay
          setTimeout(connectToSSE, 5000);
        }
      }
    };

    console.log("🔄 Setting up notification SSE connection for user:", user.id);
    connectToSSE();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        console.log("🧹 Cleaning up notification SSE connection");
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      onConnectionChange?.(false);
    };
  }, [
    user,
    queryClient,
    onNewNotification,
    onNotificationRead,
    onAllNotificationsRead,
    onConnectionChange,
  ]);

  return {
    disconnect: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      onConnectionChange?.(false);
    },
  };
};
