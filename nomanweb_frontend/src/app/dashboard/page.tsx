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
      <div className="p-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Statistics Centre
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.displayName || user?.username}! Here's your
            writing overview.
          </p>
        </div>

        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Total Stories"
            value={totalStories}
            icon={BookOpen}
            color="blue"
            description="Published stories"
            trend="+2 this month"
          />
          <DashboardCard
            title="Total Reads"
            value={totalReads}
            icon={Eye}
            color="green"
            description="All-time views"
            trend="+15% this week"
          />
          <DashboardCard
            title="Coin Balance"
            value={user?.coinBalance || 0}
            icon={Coins}
            color="yellow"
            description="Available coins"
            trend="Ready to spend"
          />
          <DashboardCard
            title="Coins Earned"
            value={totalEarnings}
            icon={TrendingUp}
            color="purple"
            description="Total earnings"
            trend="+340 this month"
          />
          <DashboardCard
            title="Followers"
            value={followers}
            icon={Users}
            color="pink"
            description="Active followers"
            trend="+12 new followers"
          />
          <DashboardCard
            title="Gifts Received"
            value={giftsReceived}
            icon={Gift}
            color="red"
            description="Reader gifts"
            trend="3 gifts this week"
          />
          <DashboardCard
            title="Notifications"
            value={notificationsCount}
            icon={Bell}
            color="orange"
            description="Unread notifications"
            trend="New activities"
          />
          <DashboardCard
            title="Member Since"
            value={memberSince}
            icon={Calendar}
            color="indigo"
            description="Year joined"
            trend={`${new Date().getFullYear() - memberSince} years active`}
          />
        </div>

        {/* Analytics Chart Section */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100 to-blue-100 rounded-full opacity-20 transform -translate-x-12 translate-y-12"></div>

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Analytics Overview
                </h3>
                <p className="text-gray-600">Performance insights</p>
              </div>
              <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                {chartFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setChartFilter(filter.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
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
            <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-xl p-6 h-48 flex items-center justify-center border border-gray-200 shadow-inner relative overflow-hidden">
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
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2 inline-block mb-3 shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickAction
              href="/stories/create"
              icon={PlusIcon}
              title="Write New Story"
              description="Start creating your next masterpiece"
              color="green"
            />
            <QuickAction
              href="/dashboard/my-stories"
              icon={FileText}
              title="Manage Stories"
              description="Edit, publish, or organize your stories"
              color="blue"
            />
            <QuickAction
              href="/dashboard/monetization"
              icon={Target}
              title="Monetization"
              description="Track earnings, gifts, and manage coins"
              color="purple"
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
  icon: Icon,
  color,
  description,
  trend,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  trend: string;
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    yellow: "text-yellow-600 bg-yellow-50",
    purple: "text-purple-600 bg-purple-50",
    pink: "text-pink-600 bg-pink-50",
    red: "text-red-600 bg-red-50",
    orange: "text-orange-600 bg-orange-50",
    indigo: "text-indigo-600 bg-indigo-50",
  };

  const [iconColorClass, bgClass] =
    colorClasses[color as keyof typeof colorClasses].split(" ");

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-center space-x-4">
        <div className={`p-2.5 rounded-md ${bgClass}`}>
          <Icon className={`h-6 w-6 ${iconColorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-600 truncate">
            {title}
          </h3>
          <p className="text-2xl font-bold text-gray-900 truncate">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </div>
  );
}

// Quick Action Component
function QuickAction({
  href,
  icon: Icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}) {
  const colorClasses = {
    green: "bg-green-100 text-green-700 hover:bg-green-200",
    blue: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    purple: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  };

  const colorClass = colorClasses[color as keyof typeof colorClasses];

  return (
    <Link
      href={href}
      className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors duration-200 group"
    >
      <div className="flex items-start space-x-3">
        <div
          className={`p-2 rounded-lg ${colorClass} transition-colors duration-200`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 mb-1">{title}</h4>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}
