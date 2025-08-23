"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
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
  Check,
  Loader2,
} from "lucide-react";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/useNotifications";
import { useEnhancedNotifications } from "@/hooks/useEnhancedNotifications";
import { Notification } from "@/types/user";
import { format } from "date-fns";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // API hooks
  const {
    data: notificationsData,
    isLoading,
    error,
  } = useNotifications(page, pageSize);
  const { data: unreadCountData } = useUnreadCount();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const notifications = notificationsData?.content || [];
  const unreadCount = unreadCountData?.unreadCount || 0;

  // Enhanced notifications with additional data
  const {
    enhancedNotifications,
    isLoading: isEnhancing,
    error: enhanceError,
  } = useEnhancedNotifications(notifications);

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
        return MessageSquare;
      case "gift_received":
        return Heart;
      case "new_story":
      case "new_chapter":
        return BookOpen;
      case "follow":
        return Users;
      case "like":
        return Star;
      case "system":
        return AlertCircle;
      default:
        return Bell;
    }
  };

  // Get color for notification type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "comment":
        return "blue";
      case "gift_received":
        return "red";
      case "new_story":
      case "new_chapter":
        return "green";
      case "follow":
        return "purple";
      case "like":
        return "yellow";
      case "system":
        return "gray";
      default:
        return "blue";
    }
  };

  // Convert backend notifications to display format
  const notificationItems = enhancedNotifications.map((notification) => ({
    id: notification.id,
    type: notification.type.toLowerCase(),
    title: notification.title,
    message: notification.message,
    timestamp: format(new Date(notification.createdAt), "yyyy-MM-dd HH:mm"),
    isRead: notification.isRead,
    icon: getNotificationIcon(notification.type),
    color: getNotificationColor(notification.type),
    relatedType: notification.relatedType,
    relatedId: notification.relatedId,
    storyTitle: notification.storyTitle,
    commentContent: notification.commentContent,
    chapterTitle: notification.chapterTitle,
  }));

  // Handle mark as read
  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Filter notifications based on current filters
  const filteredNotifications = notificationItems.filter((item) => {
    const typeMatch = filter === "all" || item.type === filter;
    const readMatch = !showUnreadOnly || !item.isRead;
    return typeMatch && readMatch;
  });

  // Calculate alert type counts
  const alertTypes = [
    { id: "all", label: "All Notifications", count: notificationItems.length },
    {
      id: "comment",
      label: "Comments",
      count: notificationItems.filter((a) => a.type === "comment").length,
    },
    {
      id: "gift_received",
      label: "Gifts",
      count: notificationItems.filter((a) => a.type === "gift_received").length,
    },
    {
      id: "new_story",
      label: "New Stories",
      count: notificationItems.filter((a) => a.type === "new_story").length,
    },
    {
      id: "new_chapter",
      label: "New Chapters",
      count: notificationItems.filter((a) => a.type === "new_chapter").length,
    },
    {
      id: "follow",
      label: "Followers",
      count: notificationItems.filter((a) => a.type === "follow").length,
    },
    {
      id: "like",
      label: "Likes",
      count: notificationItems.filter((a) => a.type === "like").length,
    },
    {
      id: "system",
      label: "Purchases",
      count: notificationItems.filter((a) => a.type === "system").length,
    },
  ];

  // Show loading state
  if (isLoading || isEnhancing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {isLoading ? "Loading notifications..." : "Enhancing notifications..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">
            Failed to load notifications. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-2">
              Stay updated with your story activities and reader interactions
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {unreadCount} unread
            </div>
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending || unreadCount === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>Mark All Read</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Filter Notifications
              </h3>

              {/* Show Unread Toggle */}
              <div className="mb-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUnreadOnly}
                    onChange={(e) => setShowUnreadOnly(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Show unread only
                  </span>
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
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="font-medium">{type.label}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        filter === type.id
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {type.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => (
                  <AlertCard
                    key={item.id}
                    alert={item}
                    onMarkAsRead={handleMarkAsRead}
                    isMarkingAsRead={markAsReadMutation.isPending}
                  />
                ))
              ) : (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                  <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No notifications found
                  </h3>
                  <p className="text-gray-500">
                    {showUnreadOnly
                      ? "You don't have any unread notifications at the moment."
                      : "No notifications match your current filter criteria."}
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
function AlertCard({
  alert,
  onMarkAsRead,
  isMarkingAsRead,
}: {
  alert: any;
  onMarkAsRead: (id: string) => void;
  isMarkingAsRead: boolean;
}) {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      red: "bg-red-100 text-red-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      yellow: "bg-yellow-100 text-yellow-600",
    };
    return colors[color as keyof typeof colors] || "bg-gray-100 text-gray-600";
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 ${
        !alert.isRead ? "border-l-4 border-l-blue-500" : ""
      }`}
    >
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className={`p-3 rounded-lg ${getColorClasses(alert.color)}`}>
          <alert.icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {alert.title}
              </h4>
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

          {/* Display story title for chapter-related notifications */}
          {alert.storyTitle && (alert.type.includes('chapter') || alert.type.includes('story')) && (
            <div className="mb-3">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                <BookOpen className="h-3 w-3 mr-1" />
                Story: {alert.storyTitle}
              </span>
            </div>
          )}

          {/* Display chapter title for chapter-related notifications */}
          {alert.chapterTitle && alert.type.includes('chapter') && (
            <div className="mb-3">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                <BookOpen className="h-3 w-3 mr-1" />
                Chapter: {alert.chapterTitle}
              </span>
            </div>
          )}

          {/* Display comment content for comment notifications */}
          {alert.commentContent && alert.type.includes('comment') && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300">
              <div className="flex items-start space-x-2">
                <MessageSquare className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Comment:</p>
                  <p className="text-sm text-gray-600 italic">"{alert.commentContent}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {!alert.isRead && (
              <button
                onClick={() => onMarkAsRead(alert.id)}
                disabled={isMarkingAsRead}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMarkingAsRead ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
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
