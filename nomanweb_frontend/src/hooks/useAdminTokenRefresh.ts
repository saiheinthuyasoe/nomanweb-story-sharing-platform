import { useCallback } from "react";
import Cookies from "js-cookie";
import { adminTokenRefreshEvents } from "@/contexts/AdminAuthContext";

export const useAdminTokenRefresh = () => {
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
      const refreshToken = Cookies.get("adminRefreshToken");
      if (!refreshToken) {
        return false;
      }

      const response = await fetch("/api/admin/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      // Update cookies with new tokens
      Cookies.set("adminToken", data.token, {
        expires: 7,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      Cookies.set("adminRefreshToken", data.refreshToken, {
        expires: 30,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      // Notify AdminAuthContext about token refresh
      adminTokenRefreshEvents.notify(data.token, data.refreshToken, data.user);

      return true;
    } catch (error) {
      console.error("Admin token refresh failed:", error);
      return false;
    }
  }, []);

  const hasValidTokens = useCallback((): boolean => {
    const token = Cookies.get("adminToken");
    const refreshToken = Cookies.get("adminRefreshToken");

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
    Cookies.remove("adminToken");
    Cookies.remove("adminRefreshToken");
  }, []);

  return {
    checkTokenExpiration,
    hasValidTokens,
    clearTokens,
    refreshTokens,
  };
};
