'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { 
  Gift, 
  Heart, 
  Star,
  TrendingUp,
  Users,
  Calendar,
  BookOpen,
  Crown,
  Sparkles,
  Award
} from 'lucide-react';

export default function GiftsPage() {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState('30d');

  // Mock gifts data - would come from API
  const giftsData = {
    totalGifts: 156,
    totalValue: 2340,
    thisMonth: 23,
    topGiftType: 'Golden Crown',
    uniqueGifters: 89
  };

  const giftTypes = [
    { name: 'Rose', icon: '🌹', value: 5, count: 45, color: 'red' },
    { name: 'Heart', icon: '❤️', value: 10, count: 32, color: 'pink' },
    { name: 'Star', icon: '⭐', value: 25, count: 28, color: 'yellow' },
    { name: 'Diamond', icon: '💎', value: 50, count: 15, color: 'blue' },
    { name: 'Golden Crown', icon: '👑', value: 100, count: 8, color: 'gold' },
    { name: 'Platinum Trophy', icon: '🏆', value: 200, count: 3, color: 'gray' }
  ];

  const recentGifts = [
    { id: 1, giver: 'Sarah Chen', gift: 'Golden Crown', value: 100, date: '2024-01-15', story: 'The Last Kingdom' },
    { id: 2, giver: 'Mike Johnson', gift: 'Diamond', value: 50, date: '2024-01-14', story: 'Digital Dreams' },
    { id: 3, giver: 'Emma Wilson', gift: 'Star', value: 25, date: '2024-01-13', story: 'The Last Kingdom' },
    { id: 4, giver: 'David Brown', gift: 'Heart', value: 10, date: '2024-01-12', story: 'Midnight Tales' },
    { id: 5, giver: 'Lisa Garcia', gift: 'Rose', value: 5, date: '2024-01-11', story: 'Digital Dreams' },
  ];

  const topGifters = [
    { name: 'Sarah Chen', totalValue: 450, giftsCount: 12, avatar: 'SC' },
    { name: 'Mike Johnson', totalValue: 380, giftsCount: 15, avatar: 'MJ' },
    { name: 'Emma Wilson', totalValue: 295, giftsCount: 18, avatar: 'EW' },
    { name: 'David Brown', totalValue: 220, giftsCount: 14, avatar: 'DB' },
    { name: 'Lisa Garcia', totalValue: 185, giftsCount: 22, avatar: 'LG' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gifts Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your received gifts and appreciation from readers</p>
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
          </div>
        </div>

        {/* Gift Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <GiftCard
            title="Total Gifts"
            value={giftsData.totalGifts}
            icon={Gift}
            color="purple"
            unit=""
          />
          <GiftCard
            title="Total Value"
            value={giftsData.totalValue}
            icon={Sparkles}
            color="gold"
            unit="coins"
          />
          <GiftCard
            title="This Month"
            value={giftsData.thisMonth}
            icon={Calendar}
            color="blue"
            unit="gifts"
          />
          <GiftCard
            title="Top Gift"
            value={giftsData.topGiftType}
            icon={Crown}
            color="amber"
            unit=""
            isText={true}
          />
          <GiftCard
            title="Unique Gifters"
            value={giftsData.uniqueGifters}
            icon={Users}
            color="green"
            unit="users"
          />
        </div>

        {/* Gift Types and Top Gifters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gift Types */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Gift Types Received</h3>
            <div className="space-y-4">
              {giftTypes.map((gift) => (
                <div key={gift.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{gift.icon}</div>
                    <div>
                      <p className="font-medium text-gray-900">{gift.name}</p>
                      <p className="text-sm text-gray-600">{gift.value} coins each</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{gift.count} gifts</p>
                    <p className="text-sm text-gray-600">{gift.count * gift.value} coins total</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Gifters */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Gifters</h3>
            <div className="space-y-4">
              {topGifters.map((gifter, index) => (
                <div key={gifter.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {gifter.avatar}
                      </div>
                      {index === 0 && (
                        <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{gifter.name}</p>
                      <p className="text-sm text-gray-600">{gifter.giftsCount} gifts sent</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-purple-600">{gifter.totalValue} coins</p>
                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(5, Math.floor(gifter.totalValue / 100)))].map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Gifts */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Gifts</h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Giver</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Gift</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Story</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Value</th>
                </tr>
              </thead>
              <tbody>
                {recentGifts.map((gift) => (
                  <tr key={gift.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">{gift.date}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{gift.giver}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                        {gift.gift}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{gift.story}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-purple-600">{gift.value} coins</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gift Analytics Chart */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gift Trends</h3>
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-lg p-8 h-64 flex items-center justify-center border-2 border-dashed border-purple-200">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-purple-500 mx-auto mb-3" />
              <p className="text-purple-700 font-medium">Gift Analytics Chart</p>
              <p className="text-purple-600 text-sm">Gift trends over time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Gift Card Component
function GiftCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  unit,
  isText = false
}: { 
  title: string; 
  value: number | string; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
  unit: string;
  isText?: boolean;
}) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600 text-purple-600 bg-purple-50',
    gold: 'from-yellow-500 to-yellow-600 text-yellow-600 bg-yellow-50',
    blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50',
    amber: 'from-amber-500 to-amber-600 text-amber-600 bg-amber-50',
    green: 'from-green-500 to-green-600 text-green-600 bg-green-50',
  };

  const [gradientClass, iconColorClass, bgClass] = colorClasses[color as keyof typeof colorClasses].split(' ');

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${gradientClass} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-xl font-bold text-gray-900">
            {isText ? value : `${typeof value === 'number' ? value.toLocaleString() : value}${unit ? ` ${unit}` : ''}`}
          </p>
        </div>
      </div>
    </div>
  );
} 