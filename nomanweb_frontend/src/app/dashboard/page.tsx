"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Coins,
  PlusIcon,
  TrendingUp,
  Eye,
  Heart,
  Calendar,
  Users,
  Gift,
  Bell,
  BarChart3,
  FileText,
  Target,
} from "lucide-react";
import { useMyStories } from "@/hooks/useStories";
import { useUserStats } from "@/hooks/useUserStats";

// Chart Filter Options
const chartFilters = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 3 months", value: "3m" },
  { label: "Last year", value: "1y" },
  { label: "All time", value: "all" },
];

export default function WriterDashboard() {
  const { user } = useAuth();
  const { data: myStories } = useMyStories({ page: 0, size: 100 });
  const {
    data: userStats,
    isLoading: statsLoading,
    error: statsError,
  } = useUserStats();
  const [chartFilter, setChartFilter] = useState("30d");

  // Calculate dashboard stats from real data
  const totalStories = myStories?.totalElements || 0;
  const totalReads = userStats?.totalViews || 0;
  const totalEarnings = user?.totalEarnedCoins || 0;
  const followers = userStats?.followers || 0;
  const giftsReceived = userStats?.giftsReceived || 0;
  const notificationsCount = userStats?.notificationsCount || 0;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : new Date().getFullYear();

  // Show loading state while fetching stats
  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your statistics...</p>
        </div>
      </div>
    );
  }

  // Show error state if stats failed to load
  if (statsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Failed to load statistics: {statsError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Dashboard Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Statistics Centre
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Welcome back, {user?.displayName || user?.username}! Here's your
            writing overview.
          </p>
        </div>

        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <DashboardCard
            title="Total Stories"
            value={totalStories}
            description="Published stories"
            trend="+2 this month"
          />
          <DashboardCard
            title="Total Reads"
            value={totalReads}
            description="All-time views"
            trend="+15% this week"
          />
          <DashboardCard
            title="Coin Balance"
            value={user?.coinBalance || 0}
            description="Available coins"
            trend="Ready to spend"
          />
          <DashboardCard
            title="Coins Earned"
            value={totalEarnings}
            description="Total earnings"
            trend="+340 this month"
          />
          <DashboardCard
            title="Followers"
            value={followers}
            description="Active followers"
            trend="+12 new followers"
          />
          <DashboardCard
            title="Gifts Received"
            value={giftsReceived}
            description="Reader gifts"
            trend="3 gifts this week"
          />
          <DashboardCard
            title="Notifications"
            value={notificationsCount}
            description="Unread notifications"
            trend="New activities"
          />
          <DashboardCard
            title="Member Since"
            value={memberSince}
            description="Year joined"
            trend={`${new Date().getFullYear() - memberSince} years active`}
          />
        </div>

        {/* Analytics Chart Section */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100 to-blue-100 rounded-full opacity-20 transform -translate-x-12 translate-y-12"></div>

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Analytics Overview
                </h3>
                <p className="text-sm sm:text-base text-gray-600">Performance insights</p>
              </div>
              <div className="bg-gray-100 p-1 rounded-lg flex flex-wrap sm:inline-flex gap-1 sm:gap-0">
                {chartFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setChartFilter(filter.value)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 flex-1 sm:flex-none ${
                      chartFilter === filter.value ? "shadow-sm" : ""
                    }`}
                    style={{
                      backgroundColor:
                        chartFilter === filter.value ? "#18243c" : "#f9fafb",
                      color:
                        chartFilter === filter.value ? "#ffffff" : "#18243c",
                      border: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (chartFilter !== filter.value) {
                        e.currentTarget.style.backgroundColor = "#f3f4f6";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (chartFilter !== filter.value) {
                        e.currentTarget.style.backgroundColor = "#f9fafb";
                      }
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-6 h-40 sm:h-48 flex items-center justify-center border border-gray-200 shadow-inner relative overflow-hidden">
              {/* Chart background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="grid grid-cols-8 h-full">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="border-r border-gray-400 last:border-r-0"
                    ></div>
                  ))}
                </div>
                <div className="absolute inset-0 grid grid-rows-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="border-b border-gray-400 last:border-b-0"
                    ></div>
                  ))}
                </div>
              </div>

              <div className="text-center relative z-10">
                <h4 className="text-lg font-bold text-gray-800 mb-2">
                  Analytics Overview
                </h4>
                <p className="text-sm text-gray-600 max-w-xs mx-auto">
                  Performance insights for{" "}
                  <span className="font-semibold" style={{ color: "#18243c" }}>
                    {chartFilters
                      .find((f) => f.value === chartFilter)
                      ?.label.toLowerCase()}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <QuickAction
              href="/stories/create"
              title="Write New Story"
              description="Start creating your next masterpiece"
            />
            <QuickAction
              href="/dashboard/my-stories"
              title="Manage Stories"
              description="Edit, publish, or organize your stories"
            />
            <QuickAction
              href="/dashboard/monetization"
              title="Monetization"
              description="Track earnings, gifts, and manage coins"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Card Component
function DashboardCard({
  title,
  value,
  description,
  trend,
}: {
  title: string;
  value: number | string;
  description: string;
  trend: string;
}) {

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-all duration-200">
      <div className="flex-1 min-w-0">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">
          {title}
        </h3>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}

// Quick Action Component
function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors duration-200 group"
    >
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900 mb-1">{title}</h4>
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
