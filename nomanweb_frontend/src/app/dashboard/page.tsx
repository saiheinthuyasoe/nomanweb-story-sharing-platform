'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import Link from 'next/link';
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
  Target
} from 'lucide-react';
import { useMyStories } from '@/hooks/useStories';

// Chart Filter Options
const chartFilters = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last year', value: '1y' },
  { label: 'All time', value: 'all' },
];

export default function WriterDashboard() {
  const { user } = useAuth();
  const { data: myStories } = useMyStories({ page: 0, size: 100 });
  const [chartFilter, setChartFilter] = useState('30d');

  // Calculate dashboard stats
  const totalStories = myStories?.totalElements || 0;
  const totalReads = 12450; // Mock data - would come from API
  const totalEarnings = user?.totalEarnedCoins || 0;
  const followers = 185; // Mock data
  const giftsReceived = 23; // Mock data
  const alertsCount = 5; // Mock data
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="p-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistics Centre</h1>
          <p className="text-gray-600">Welcome back, {user?.displayName || user?.username}! Here's your writing overview.</p>
        </div>
        
        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            title="Alerts"
            value={alertsCount}
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Analytics Overview</h3>
            <div className="flex items-center space-x-2">
              {chartFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setChartFilter(filter.value)}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                    chartFilter === filter.value
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Chart Placeholder */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8 h-64 flex items-center justify-center border-2 border-dashed border-blue-200">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-blue-700 mb-2">Analytics Chart</h4>
              <p className="text-blue-600">Story views, earnings, and engagement metrics for {chartFilters.find(f => f.value === chartFilter)?.label.toLowerCase()}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickAction
              href="/write"
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
              href="/dashboard/income"
              icon={Target}
              title="Detailed Analytics"
              description="View comprehensive performance metrics"
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
  trend
}: { 
  title: string; 
  value: number | string; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
  description: string;
  trend: string;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50',
    green: 'from-green-500 to-green-600 text-green-600 bg-green-50',
    yellow: 'from-yellow-500 to-yellow-600 text-yellow-600 bg-yellow-50',
    purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50',
    pink: 'from-pink-500 to-pink-600 text-pink-600 bg-pink-50',
    red: 'from-red-500 to-red-600 text-red-600 bg-red-50',
    orange: 'from-orange-500 to-orange-600 text-orange-600 bg-orange-50',
    indigo: 'from-indigo-500 to-indigo-600 text-indigo-600 bg-indigo-50',
  };

  const [gradientClass, iconColorClass, bgClass] = colorClasses[color as keyof typeof colorClasses].split(' ');

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${gradientClass} text-white`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <p className="text-sm font-medium text-gray-600">{title}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600">{description}</p>
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bgClass} ${iconColorClass}`}>
          {trend}
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
  color 
}: { 
  href: string; 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  description: string;
  color: string;
}) {
  const colorClasses = {
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
  };

  const gradientClass = colorClasses[color as keyof typeof colorClasses];

  return (
    <Link
      href={href}
      className="block p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-all duration-200 group"
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${gradientClass} text-white group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
} 