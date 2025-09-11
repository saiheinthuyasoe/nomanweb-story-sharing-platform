"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  CurrencyDollarIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  {
    name: "Homepage Management",
    href: "/admin/homepage",
    icon: StarIcon,
  },
  {
    name: "Book Insights",
    href: "/admin/insights",
    icon: ChartBarIcon,
  },
  {
    name: "Content Moderation",
    href: "/admin/moderation",
    icon: ExclamationTriangleIcon,
  },
  {
    name: "User Management",
    href: "/admin/users",
    icon: UserGroupIcon,
  },
  {
    name: "Coin Management",
    href: "/admin/coins",
    icon: CurrencyDollarIcon,
  },
  {
    name: "Content Reports",
    href: "/admin/reports",
    icon: DocumentTextIcon,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: ChartBarIcon,
  },
  {
    name: "OAuth Migration",
    href: "/admin/migration",
    icon: CogIcon,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAdminAuth = async () => {
      // Allow access to login page without authentication
      if (pathname === "/admin/login") {
        setIsLoading(false);
        return;
      }

      try {
        const adminToken = localStorage.getItem("adminToken");
        const adminUserData = localStorage.getItem("adminUser");

        if (!adminToken || !adminUserData) {
          router.push("/admin/login");
          return;
        }

        // Verify admin token is still valid
        const response = await fetch("/api/admin/auth/verify-admin", {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Admin authentication failed");
        }

        const adminUser = JSON.parse(adminUserData);

        // Double-check user role
        if (adminUser.role !== "ADMIN") {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          router.push("/admin/login");
          return;
        }

        setAdminUser(adminUser);
      } catch (error) {
        console.error("Admin auth check failed:", error);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        router.push("/admin/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, [router, pathname]);

  // Add effect to listen for storage changes (when login happens in same tab)
  useEffect(() => {
    const handleStorageChange = async () => {
      if (pathname === "/admin/login") {
        return;
      }

      const adminToken = localStorage.getItem("adminToken");
      const adminUserData = localStorage.getItem("adminUser");

      if (adminToken && adminUserData && !adminUser) {
        // Authentication just happened, re-check auth
        setIsLoading(true);
        try {
          // Verify the token is valid
          const response = await fetch("/api/admin/auth/verify-admin", {
            headers: {
              Authorization: `Bearer ${adminToken}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const adminUser = JSON.parse(adminUserData);
            setAdminUser(adminUser);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            router.push("/admin/login");
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
          router.push("/admin/login");
        } finally {
          setIsLoading(false);
        }
      } else if (!adminToken && adminUser) {
        // Logout happened
        setAdminUser(null);
        router.push("/admin/login");
      }
    };

    // Listen for storage events (cross-tab) and custom events (same-tab)
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("adminAuthChange", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("adminAuthChange", handleStorageChange);
    };
  }, [adminUser, router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");

    // Dispatch custom event to notify of auth change
    window.dispatchEvent(new Event("adminAuthChange"));

    router.push("/admin/login");
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying Admin Access
          </h2>
          <p className="text-gray-600">
            Please wait while we verify your credentials...
          </p>
        </div>
      </div>
    );
  }

  // Allow access to login page without admin user
  if (!adminUser && pathname !== "/admin/login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this area.
          </p>
          <Link
            href="/admin/login"
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Admin Login
          </Link>
        </div>
      </div>
    );
  }

  // For login page, render without sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 shadow-lg" style={{backgroundColor: '#1a1a1a'}}>
        <div className="flex flex-col h-full">
          {/* Admin User Info */}
          <div className="px-4 py-6 bg-gradient-to-r from-[#1a2332] to-[#1f2937] mx-2 mt-2 rounded-xl border border-gray-600/30">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-black rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/10">
                  <span className="text-white font-bold text-xl">
                    {adminUser.displayName?.charAt(0) ||
                      adminUser.username.charAt(0)}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate mb-1">
                  {adminUser.displayName || adminUser.username}
                </h3>
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.734.99A.996.996 0 0118 6v2a1 1 0 11-2 0v-.277l-1.254.145a1 1 0 11-.992-1.736L14.984 6l-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.723V12a1 1 0 11-2 0v-1.277l-1.246-.855a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.277l1.246.855a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.277V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z" clipRule="evenodd" />
                  </svg>
                  ADMINISTRATOR
                </div>
              </div>
            </div>
          </div>
          
          {/* Logo section removed */}

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-2 space-y-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-gray-500/30 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pl-64">
        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
