'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  Coins,
  Eye,
  BookOpen,
  Clock
} from 'lucide-react';

export default function IncomePage() {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState('30d');

  // Mock income data - would come from API
  const incomeData = {
    totalEarnings: user.totalEarnedCoins || 2340,
    monthlyEarnings: 485,
    weeklyEarnings: 125,
    todayEarnings: 28,
    topStoryEarnings: 890,
    averagePerStory: 156
  };

  const recentTransactions = [
    { id: 1, date: '2024-01-15', story: 'The Last Kingdom', amount: 45, type: 'Story Purchase' },
    { id: 2, date: '2024-01-14', story: 'Digital Dreams', amount: 32, type: 'Story Purchase' },
    { id: 3, date: '2024-01-13', story: 'The Last Kingdom', amount: 18, type: 'Gift' },
    { id: 4, date: '2024-01-12', story: 'Midnight Tales', amount: 67, type: 'Story Purchase' },
    { id: 5, date: '2024-01-11', story: 'Digital Dreams', amount: 23, type: 'Story Purchase' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Income Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your earnings and revenue analytics</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="3m">Last 3 months</option>
              <option value="1y">Last year</option>
            </select>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Income Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <IncomeCard
            title="Total Earnings"
            value={incomeData.totalEarnings}
            icon={DollarSign}
            color="green"
            change="+12.5%"
            period="All time"
          />
          <IncomeCard
            title="This Month"
            value={incomeData.monthlyEarnings}
            icon={Calendar}
            color="blue"
            change="+8.2%"
            period="vs last month"
          />
          <IncomeCard
            title="This Week"
            value={incomeData.weeklyEarnings}
            icon={Clock}
            color="purple"
            change="+15.3%"
            period="vs last week"
          />
          <IncomeCard
            title="Today"
            value={incomeData.todayEarnings}
            icon={TrendingUp}
            color="orange"
            change="+5.7%"
            period="vs yesterday"
          />
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Earnings Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Over Time</h3>
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-8 h-64 flex items-center justify-center border-2 border-dashed border-green-200">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-green-700 font-medium">Earnings Chart</p>
                <p className="text-green-600 text-sm">Daily/Weekly/Monthly revenue</p>
              </div>
            </div>
          </div>

          {/* Top Earning Stories */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Earning Stories</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">The Last Kingdom</p>
                    <p className="text-sm text-gray-600">Fantasy • 15 chapters</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">890 coins</p>
                  <p className="text-xs text-gray-500">245 sales</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-gray-900">Digital Dreams</p>
                    <p className="text-sm text-gray-600">Sci-Fi • 12 chapters</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">567 coins</p>
                  <p className="text-xs text-gray-500">178 sales</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Midnight Tales</p>
                    <p className="text-sm text-gray-600">Horror • 8 chapters</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">423 coins</p>
                  <p className="text-xs text-gray-500">134 sales</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Story</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">{transaction.date}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{transaction.story}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.type === 'Gift' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-green-600">+{transaction.amount} coins</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Income Card Component
function IncomeCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  change,
  period
}: { 
  title: string; 
  value: number; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
  change: string;
  period: string;
}) {
  const colorClasses = {
    green: 'from-green-500 to-green-600 text-green-600 bg-green-50',
    blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50',
    purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50',
    orange: 'from-orange-500 to-orange-600 text-orange-600 bg-orange-50',
  };

  const [gradientClass, iconColorClass, bgClass] = colorClasses[color as keyof typeof colorClasses].split(' ');

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${gradientClass} text-white`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()} coins</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bgClass} ${iconColorClass}`}>
              {change}
            </span>
            <span className="text-xs text-gray-500">{period}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 