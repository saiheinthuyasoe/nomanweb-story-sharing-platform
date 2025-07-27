import { useCallback } from "react";
import Cookies from "js-cookie";
import { tokenRefreshEvents } from "@/contexts/AuthContext";

export const useTokenRefresh = () => {
  const checkTokenExpiration = useCallback((token: string): boolean => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));
      const exp = new Date(payload.exp * 1000);
      const now = new Date();

      // Add 5 minute buffer to prevent race conditions
      const buffer = 5 * 60 * 1000; // 5 minutes
      return now.getTime() >= exp.getTime() - buffer;
    } catch (error) {
      return true;
    }
  }, []);

  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = Cookies.get("refreshToken");
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
        }/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      // Update cookies with new tokens
      Cookies.set("token", data.token, {
        expires: 7,
        path: "/",
        secure: false,
        sameSite: "strict",
      });
      Cookies.set("refreshToken", data.refreshToken, {
        expires: 7,
        path: "/",
        secure: false,
        sameSite: "strict",
      });

      // Notify AuthContext about token refresh
      tokenRefreshEvents.notify(data.token, data.refreshToken);

      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }, []);

  const hasValidTokens = useCallback((): boolean => {
    const token = Cookies.get("token");
    const refreshToken = Cookies.get("refreshToken");

    if (!token || !refreshToken) {
      return false;
    }

    // Check if access token is still valid (not expired)
    if (!checkTokenExpiration(token)) {
      return true;
    }

    // If access token is expired, check if refresh token is valid
    return !checkTokenExpiration(refreshToken);
  }, [checkTokenExpiration]);

  const clearTokens = useCallback(() => {
    Cookies.remove("token");
    Cookies.remove("refreshToken");
  }, []);

  return {
    checkTokenExpiration,
    hasValidTokens,
    clearTokens,
    refreshTokens,
  };
};
