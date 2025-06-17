'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { 
  Bell, 
  MessageSquare,
  Heart,
  DollarSign,
  BookOpen,
  Users,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Trash2,
  MarkAsRead
} from 'lucide-react';

export default function AlertsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Mock alerts data
  const alerts = [
    {
      id: 1,
      type: 'comment',
      title: 'New Comment',
      message: 'Sarah Chen commented on "The Last Kingdom"',
      timestamp: '2024-01-15 14:30',
      isRead: false,
      storyTitle: 'The Last Kingdom',
      icon: MessageSquare,
      color: 'blue'
    },
    {
      id: 2,
      type: 'gift',
      title: 'Gift Received',
      message: 'Mike Johnson sent you a Golden Crown',
      timestamp: '2024-01-15 12:15',
      isRead: false,
      storyTitle: 'Digital Dreams',
      icon: Heart,
      color: 'red'
    },
    {
      id: 3,
      type: 'purchase',
      title: 'Story Purchase',
      message: 'Emma Wilson purchased "Midnight Tales"',
      timestamp: '2024-01-14 18:45',
      isRead: true,
      storyTitle: 'Midnight Tales',
      icon: DollarSign,
      color: 'green'
    },
    {
      id: 4,
      type: 'follower',
      title: 'New Follower',
      message: 'David Brown started following you',
      timestamp: '2024-01-14 16:20',
      isRead: true,
      icon: Users,
      color: 'purple'
    },
    {
      id: 5,
      type: 'rating',
      title: 'Story Rated',
      message: 'Lisa Garcia gave "The Last Kingdom" 5 stars',
      timestamp: '2024-01-13 20:10',
      isRead: false,
      storyTitle: 'The Last Kingdom',
      icon: Star,
      color: 'yellow'
    },
    {
      id: 6,
      type: 'milestone',
      title: 'Milestone Reached',
      message: '"Digital Dreams" reached 1,000 views!',
      timestamp: '2024-01-13 15:30',
      isRead: true,
      storyTitle: 'Digital Dreams',
      icon: CheckCircle,
      color: 'green'
    }
  ];

  const alertTypes = [
    { id: 'all', label: 'All Alerts', count: alerts.length },
    { id: 'comment', label: 'Comments', count: alerts.filter(a => a.type === 'comment').length },
    { id: 'gift', label: 'Gifts', count: alerts.filter(a => a.type === 'gift').length },
    { id: 'purchase', label: 'Purchases', count: alerts.filter(a => a.type === 'purchase').length },
    { id: 'follower', label: 'Followers', count: alerts.filter(a => a.type === 'follower').length },
    { id: 'rating', label: 'Ratings', count: alerts.filter(a => a.type === 'rating').length },
    { id: 'milestone', label: 'Milestones', count: alerts.filter(a => a.type === 'milestone').length }
  ];

  const filteredAlerts = alerts.filter(alert => {
    const typeMatch = filter === 'all' || alert.type === filter;
    const readMatch = !showUnreadOnly || !alert.isRead;
    return typeMatch && readMatch;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
            <p className="text-gray-600 mt-2">Stay updated with your story activities and reader interactions</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {unreadCount} unread
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Mark All Read
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Alerts</h3>
              
              {/* Show Unread Toggle */}
              <div className="mb-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnreadOnly}
                    onChange={(e) => setShowUnreadOnly(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Show unread only</span>
                </label>
              </div>

              {/* Alert Type Filters */}
              <div className="space-y-2">
                {alertTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFilter(type.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                      filter === type.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{type.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      filter === type.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {type.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                  <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
                  <p className="text-gray-500">
                    {showUnreadOnly 
                      ? "You don't have any unread alerts at the moment."
                      : "No alerts match your current filter criteria."
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Alert Card Component
function AlertCard({ alert }: { alert: any }) {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      red: 'bg-red-100 text-red-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      yellow: 'bg-yellow-100 text-yellow-600',
    };
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 ${
      !alert.isRead ? 'border-l-4 border-l-blue-500' : ''
    }`}>
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className={`p-3 rounded-lg ${getColorClasses(alert.color)}`}>
          <alert.icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{alert.title}</h4>
              {!alert.isRead && (
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{alert.timestamp}</span>
            </div>
          </div>
          
          <p className="text-gray-700 mb-3">{alert.message}</p>
          
          {alert.storyTitle && (
            <div className="mb-4">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                <BookOpen className="h-3 w-3 mr-1" />
                {alert.storyTitle}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {!alert.isRead && (
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Mark as read</span>
              </button>
            )}
            <button className="text-gray-500 hover:text-red-600 text-sm font-medium flex items-center space-x-1">
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 