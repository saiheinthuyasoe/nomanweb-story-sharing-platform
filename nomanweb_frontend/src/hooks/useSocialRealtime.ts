"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface SocialUpdateData {
  type: string;
  data: any;
  timestamp: number;
}

interface UseSocialRealtimeProps {
  onNewFollower?: (data: any) => void;
  onFollowerRemoved?: (data: any) => void;
  onStoryLiked?: (data: any) => void;
  onStoryUnliked?: (data: any) => void;
  onCommentLiked?: (data: any) => void;
  onCommentUnliked?: (data: any) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const useSocialRealtime = ({
  onNewFollower,
  onFollowerRemoved,
  onStoryLiked,
  onStoryUnliked,
  onCommentLiked,
  onCommentUnliked,
  onConnectionChange,
}: UseSocialRealtimeProps = {}) => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  const connect = useCallback(async () => {
    if (!token || !user) {
      console.log(
        "🔒 No token or user available for social realtime connection. User must be logged in for real-time updates."
      );
      return;
    }

    console.log("🚀 Attempting to connect to social realtime SSE...");

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const response = await fetch(`${baseUrl}/users/sse/social-updates`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        console.error(
          `❌ Social SSE connection failed: ${response.status} ${response.statusText}`
        );
        throw new Error(`Social SSE connection failed: ${response.status}`);
      }

      console.log("✅ Social realtime SSE connection opened successfully");
      isConnectedRef.current = true;
      onConnectionChange?.(true);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available for response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = line.slice(6);
              if (data === "Connected to social updates") {
                console.log("✅ Social SSE connection confirmed");
                continue;
              }

              const updateData: SocialUpdateData = JSON.parse(data);
              console.log("📨 Social update received:", updateData);

              switch (updateData.type) {
                case "new_follower":
                  console.log("👥 New follower event received");
                  onNewFollower?.(updateData.data);
                  // Invalidate all follower-related queries for both current user and the follower
                  queryClient.invalidateQueries({
                    queryKey: ["followers"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["following"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["userStats"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["isFollowing"],
                  });
                  // Also invalidate user profile queries for author pages
                  queryClient.invalidateQueries({
                    queryKey: ["userProfile"],
                  });
                  // Force refetch to ensure immediate updates
                  queryClient.refetchQueries({
                    queryKey: ["followers"],
                  });
                  queryClient.refetchQueries({
                    queryKey: ["following"],
                  });
                  queryClient.refetchQueries({
                    queryKey: ["userStats"],
                  });
                  queryClient.refetchQueries({
                    queryKey: ["userProfile"],
                  });
                  queryClient.refetchQueries({
                    queryKey: ["userProfile"],
                  });
                  break;

                case "follower_removed":
                  console.log("👥 Follower removed event received");
                  onFollowerRemoved?.(updateData.data);
                  // Invalidate all follower-related queries for both current user and the unfollower
                  queryClient.invalidateQueries({
                    queryKey: ["followers"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["following"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["userStats"],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["isFollowing"],
                  });
                  // Also invalidate user profile queries for author pages
                  queryClient.invalidateQueries({
                    queryKey: ["userProfile"],
                  });
                  // Force refetch to ensure immediate updates
                  queryClient.refetchQueries({
                    queryKey: ["followers"],
                  });
                  queryClient.refetchQueries({
                    queryKey: ["following"],
                  });
                  queryClient.refetchQueries({
                    queryKey: ["userStats"],
                  });
                  break;

                case "story_liked":
                  console.log("❤️ Story liked event received");
                  onStoryLiked?.(updateData.data);
                  // Invalidate story queries
                  queryClient.invalidateQueries({
                    queryKey: ["story", updateData.data.storyId],
                  });
                  break;

                case "story_unliked":
                  console.log("💔 Story unliked event received");
                  onStoryUnliked?.(updateData.data);
                  // Invalidate story queries
                  queryClient.invalidateQueries({
                    queryKey: ["story", updateData.data.storyId],
                  });
                  break;

                case "comment_liked":
                  console.log("👍 Comment liked event received");
                  onCommentLiked?.(updateData.data);
                  // Invalidate comment queries
                  queryClient.invalidateQueries({
                    queryKey: ["comments", updateData.data.storyId],
                  });
                  break;

                case "comment_unliked":
                  console.log("👎 Comment unliked event received");
                  onCommentUnliked?.(updateData.data);
                  // Invalidate comment queries
                  queryClient.invalidateQueries({
                    queryKey: ["comments", updateData.data.storyId],
                  });
                  break;

                default:
                  console.log(
                    "❓ Unknown social update type:",
                    updateData.type
                  );
              }
            } catch (error) {
              console.error("❌ Error parsing social update data:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Social realtime SSE connection error:", error);
      isConnectedRef.current = false;
      onConnectionChange?.(false);

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Attempt to reconnect after a delay
      console.log("🔄 Connection will attempt to reconnect in 3 seconds...");
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("🔄 Attempting to reconnect social realtime SSE...");
        connect();
      }, 3000);
    }
  }, [
    token,
    user,
    queryClient,
    onNewFollower,
    onFollowerRemoved,
    onStoryLiked,
    onStoryUnliked,
    onCommentLiked,
    onCommentUnliked,
    onConnectionChange,
  ]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      isConnectedRef.current = false;
    };
  }, [connect]);

  return {
    isConnected: isConnectedRef.current,
    reconnect: connect,
  };
};
