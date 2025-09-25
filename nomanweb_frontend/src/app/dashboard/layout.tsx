"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  DollarSign,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";

// Dashboard Sidebar Navigation Items
const sidebarItems = [
  {
    id: "statistics",
    label: "Statistics Centre",
    icon: BarChart3,
    href: "/dashboard",
  },
  {
    id: "stories",
    label: "Stories",
    icon: BookOpen,
    href: "/dashboard/my-stories",
  },
  {
    id: "monetization",
    label: "Monetization",
    icon: DollarSign,
    href: "/dashboard/monetization",
  },
  {
    id: "notification",
    label: "Notification",
    icon: Bell,
    href: "/dashboard/notifications",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    console.log("🔍 Dashboard layout auth check:", {
      loading,
      user: user ? "present" : "null",
    });

    // Check if we have tokens in cookies even if user state is not set yet
    const token = document.cookie.includes("token=");
    const refreshToken = document.cookie.includes("refreshToken=");

    console.log("🔍 Cookie check:", {
      hasToken: token,
      hasRefreshToken: refreshToken,
    });

    if (!loading && !user && !token) {
      console.log("🚨 No user and no token found, redirecting to login");
      router.push("/login");
    } else if (!loading && !user && token) {
      console.log(
        "⚠️ User state not set but token exists, waiting for auth to complete..."
      );
      // Don't redirect immediately if we have tokens but user state isn't set yet
      // This can happen during OAuth flow
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname === "/dashboard") return "statistics";
    if (pathname.includes("/stories") || pathname.includes("/my-stories")) return "stories";
    if (pathname.includes("/monetization")) return "monetization";
    if (pathname.includes("/notifications")) return "notification";
    return "statistics";
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar - hidden on mobile/tablet */}
      <div className="hidden lg:flex w-48 bg-white shadow-sm border-r border-gray-100 flex-col">
        {/* Sidebar Header */}
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-white font-medium text-xs">
              {user.displayName?.charAt(0) || user.username?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-medium text-gray-900 truncate">
                {user.displayName || user.username}
              </h2>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-3">
            <ul className="space-y-3">
              {sidebarItems.map((item) => {
                const isActive = getActiveTab() === item.id;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`w-full flex items-center px-3 py-3 rounded-md transition-colors duration-150 ${
                        isActive
                          ? "bg-gray-900 text-white"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 mr-3 ${
                          isActive ? "text-white" : "text-gray-400"
                        }`}
                      />
                      <span className="text-sm font-medium">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3 text-gray-400" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="pb-16 lg:pb-0">{children}</div>
      </div>

      {/* Bottom Navigation - visible on mobile/tablet only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center py-2">
          {sidebarItems.slice(0, 4).map((item) => {
            const isActive = getActiveTab() === item.id;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate max-w-12">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
