"use client";

import React from "react";
import { usePathname } from "next/navigation";
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
import { useAdminAuth, AdminAuthProvider } from "@/contexts/AdminAuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavItems = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: HomeIcon,
  },
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
    name: "Withdrawal Management",
    href: "/admin/withdrawals",
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
  {
    name: "Settings",
    href: "/admin/settings",
    icon: CogIcon,
  },
];

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const { adminUser, loading: isLoading, logout } = useAdminAuth();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
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
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Admin Panel
              </span>
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-blue-600 transition-colors"
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {adminUser.displayName?.charAt(0) ||
                    adminUser.username.charAt(0)}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {adminUser.displayName || adminUser.username}
                </p>
                <p className="text-xs text-red-600 font-medium">
                  Administrator
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pl-64">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to Main Site
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Secure Admin Access
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  );
}
