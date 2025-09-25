"use client";

import React, { useState } from "react";
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
  ChevronLeftIcon,
  ChevronRightIcon,
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
];

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const { adminUser, loading: isLoading, logout } = useAdminAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#18243c] via-[#1a2640] to-[#18243c] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#18243c] mx-auto mb-4"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-[#18243c] via-[#1a2640] to-[#18243c] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this area.
          </p>
          <Link
            href="/admin/login"
            className="text-[#18243c] hover:text-[#1a2640] font-medium"
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
      <div
        className={`fixed inset-y-0 left-0 z-50 ${
          isCollapsed ? "w-16" : "w-64"
        } bg-white shadow-sm border-r border-gray-100 flex-col hidden lg:flex transition-all duration-300`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-3 border-b border-gray-100 relative">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-white font-medium text-xs">
                  {adminUser.displayName?.charAt(0) ||
                    adminUser.username.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-medium text-gray-900 truncate">
                    {adminUser.displayName || adminUser.username}
                  </h2>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="flex justify-center">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-white font-medium text-xs">
                  {adminUser.displayName?.charAt(0) ||
                    adminUser.username.charAt(0)}
                </div>
              </div>
            )}
            {/* Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:shadow-md transition-shadow"
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-3">
              <ul className="space-y-3">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`w-full flex items-center ${
                          isCollapsed ? "justify-center px-2 py-3" : "px-3 py-3"
                        } rounded-md transition-colors duration-150 ${
                          isActive
                            ? "bg-gray-900 text-white"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <Icon
                          className={`h-4 w-4 ${isCollapsed ? "" : "mr-3"} ${
                            isActive ? "text-white" : "text-gray-400"
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="text-sm font-medium">
                            {item.name}
                          </span>
                        )}
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
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center px-2 py-2" : "px-3 py-2"
              } rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors`}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <ArrowLeftOnRectangleIcon
                className={`h-4 w-4 ${isCollapsed ? "" : "mr-3"} text-gray-400`}
              />
              {!isCollapsed && (
                <span className="text-sm font-medium">Sign Out</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`${
          isCollapsed ? "pl-16" : "pl-64"
        } transition-all duration-300`}
      >
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
