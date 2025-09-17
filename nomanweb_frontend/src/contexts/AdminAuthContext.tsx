"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

// Event system for admin token refresh notifications
class AdminTokenRefreshEvents {
  private subscribers: Array<
    (token: string, refreshToken: string, user: any) => void
  > = [];

  subscribe(
    callback: (token: string, refreshToken: string, user: any) => void
  ) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    };
  }

  notify(token: string, refreshToken: string, user: any) {
    this.subscribers.forEach((callback) => callback(token, refreshToken, user));
  }
}

export const adminTokenRefreshEvents = new AdminTokenRefreshEvents();

interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  status: string;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string, adminCode?: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<boolean>;
  updateAdminUser: (userData: Partial<AdminUser>) => void;
  setAuthData: (token: string, refreshToken: string, user: AdminUser) => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check for existing admin authentication on mount
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const token = Cookies.get("adminToken");
        const refreshToken = Cookies.get("adminRefreshToken");

        if (token && refreshToken) {
          // Verify the token is still valid
          const response = await fetch("/api/admin/auth/verify-admin", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setAdminUser(userData.user || userData);
          } else {
            // Token is invalid, try to refresh
            const refreshSuccess = await refreshTokens();
            if (!refreshSuccess) {
              clearAuthData();
            }
          }
        }
      } catch (error) {
        console.error("Admin auth check failed:", error);
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    checkAdminAuth();

    // Subscribe to token refresh events
    const unsubscribe = adminTokenRefreshEvents.subscribe(
      (token, refreshToken, user) => {
        setAdminUser(user);
      }
    );

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string, adminCode?: string) => {
    try {
      const requestBody: any = { email, password };
      if (adminCode) {
        requestBody.adminCode = adminCode;
      }

      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Admin login failed");
      }

      // Store admin tokens in secure cookies
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

      setAdminUser(data.user);
      toast.success("Admin login successful!");
      router.push("/admin/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Admin login failed");
      throw error;
    }
  };

  const refreshTokens = async (): Promise<boolean> => {
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

      setAdminUser(data.user);
      return true;
    } catch (error) {
      console.error("Admin token refresh failed:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = Cookies.get("adminRefreshToken");

      if (refreshToken) {
        // Call logout endpoint to revoke refresh token
        await fetch("/api/admin/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error("Admin logout error:", error);
    } finally {
      clearAuthData();
      toast.success("Admin logged out successfully");
      router.push("/admin/login");
    }
  };

  const clearAuthData = () => {
    Cookies.remove("adminToken");
    Cookies.remove("adminRefreshToken");
    setAdminUser(null);
  };

  const updateAdminUser = (userData: Partial<AdminUser>) => {
    setAdminUser((prev) => (prev ? { ...prev, ...userData } : null));
  };

  const setAuthData = (
    token: string,
    refreshToken: string,
    user: AdminUser
  ) => {
    Cookies.set("adminToken", token, {
      expires: 7,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    Cookies.set("adminRefreshToken", refreshToken, {
      expires: 30,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    setAdminUser(user);
  };

  const value = {
    adminUser,
    loading,
    login,
    logout,
    refreshTokens,
    updateAdminUser,
    setAuthData,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
