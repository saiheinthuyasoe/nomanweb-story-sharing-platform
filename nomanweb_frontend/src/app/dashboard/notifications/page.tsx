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
  useDeleteNotification,
  useBulkDeleteNotifications,
} from "@/hooks/useNotifications";
import { useStory } from "@/hooks/useStories";
import { useChapter } from "@/hooks/useChapters";
import {
  useComment,
  useChapterComments,
  useStoryComments,
} from "@/hooks/useComments";
import { useUser } from "@/hooks/useUser";
import { useGiftTransaction } from "@/hooks/useGiftTransaction";
import { Notification } from "@/types/user";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );
  const [selectAll, setSelectAll] = useState(false);
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
  const deleteNotificationMutation = useDeleteNotification();
  const bulkDeleteMutation = useBulkDeleteNotifications();

  const notifications = notificationsData?.content || [];
  const unreadCount = unreadCountData?.unreadCount || 0;

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
        return DollarSign;
      case "moderation":
        return AlertCircle;
      case "purchase":
        return DollarSign;
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
        return "green";
      case "moderation":
        return "orange";
      case "purchase":
        return "green";
      default:
        return "blue";
    }
  };

  // Convert backend notifications to display format
  const notificationItems = notifications.map((notification: Notification) => ({
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
    // For comment notifications, we'll fetch the story title separately
    isCommentNotification: notification.type.toLowerCase() === "comment",
    // For like notifications, we'll fetch the story title and modify the message
    isLikeNotification: notification.type.toLowerCase() === "like",
  }));

  // Handle mark as read
  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Handle individual delete
  const handleDeleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
    setSelectedNotifications((prev) =>
      prev.filter((id) => id !== notificationId)
    );
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedNotifications.length > 0) {
      bulkDeleteMutation.mutate(selectedNotifications);
      setSelectedNotifications([]);
      setSelectAll(false);
    }
  };

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedNotifications([]);
      setSelectAll(false);
    } else {
      const allIds = filteredNotifications.map((item) => item.id);
      setSelectedNotifications(allIds);
      setSelectAll(true);
    }
  };

  // Handle individual selection
  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications((prev) => {
      if (prev.includes(notificationId)) {
        const newSelection = prev.filter((id) => id !== notificationId);
        if (newSelection.length === 0) {
          setSelectAll(false);
        }
        return newSelection;
      } else {
        const newSelection = [...prev, notificationId];
        if (newSelection.length === filteredNotifications.length) {
          setSelectAll(true);
        }
        return newSelection;
      }
    });
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
      label: "Purchase",
      count: notificationItems.filter((a) => a.type === "system").length,
    },
    {
      id: "moderation",
      label: "Moderation",
      count: notificationItems.filter((a) => a.type === "moderation").length,
    },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-black mx-auto mb-4" />
          <p className="text-black">Loading notifications...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-black">
            Failed to load notifications. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 lg:mb-8 gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black">Notifications</h1>
            <p className="text-black mt-1 sm:mt-2 text-sm sm:text-base">
              Stay updated with your story activities and reader interactions
            </p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
            <div className="bg-gray-100 text-black px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
              {unreadCount} unread
            </div>
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending || unreadCount === 0}
              className="bg-[#18243c] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#0f1a2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline">Mark All Read</span>
              <span className="sm:hidden">Mark All</span>
            </button>
          </div>
        </div>

        {/* Selection and Bulk Actions */}
        {filteredNotifications.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
            {/* Mobile: Stack vertically */}
            <div className="sm:hidden space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-[#18243c] focus:ring-[#18243c]"
                />
                <span className="text-sm font-medium text-black">
                  Select All ({filteredNotifications.length})
                </span>
              </label>
              {selectedNotifications.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-black">
                    {selectedNotifications.length} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="bg-[#18243c] text-white px-3 py-2 rounded-lg hover:bg-[#0f1a2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
                  >
                    {bulkDeleteMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    <span>Delete ({selectedNotifications.length})</span>
                  </button>
                </div>
              )}
            </div>
            {/* Desktop: Horizontal layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-[#18243c] focus:ring-[#18243c]"
                  />
                  <span className="text-sm font-medium text-black">
                    Select All ({filteredNotifications.length})
                  </span>
                </label>
                {selectedNotifications.length > 0 && (
                  <span className="text-sm text-black">
                    {selectedNotifications.length} selected
                  </span>
                )}
              </div>
              {selectedNotifications.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="bg-[#18243c] text-white px-4 py-2 rounded-lg hover:bg-[#0f1a2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {bulkDeleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>Delete Selected ({selectedNotifications.length})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filter Notifications */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold text-black mb-4">
            Filter Notifications
          </h3>
          
          {/* Show Unread Toggle */}
          <div className="mb-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="rounded border-gray-300 text-[#18243c] focus:ring-[#18243c]"
              />
              <span className="text-sm font-medium text-black">
                Show unread only
              </span>
            </label>
          </div>

          {/* Horizontal Filter Buttons */}
          <div className="bg-gray-100 p-1 rounded-lg">
            {/* Mobile: Horizontal scroll */}
            <div className="sm:hidden">
              <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-hide">
                {alertTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFilter(type.id)}
                    className={`flex items-center justify-center px-2 py-2 rounded-md text-center transition-colors min-h-[36px] space-x-1 whitespace-nowrap flex-shrink-0 ${
                      filter === type.id
                        ? "bg-[#18243c] text-white shadow-sm"
                        : "text-black hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <span className="font-medium text-xs truncate">
                      {type.label}
                    </span>
                    <span
                      className={`text-xs px-1 py-0.5 rounded-full min-w-[16px] ${
                        filter === type.id
                          ? "bg-white text-[#18243c]"
                          : "bg-gray-200 text-black"
                      }`}
                    >
                      {type.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Desktop: Grid layout */}
            <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-1">
              {alertTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFilter(type.id)}
                  className={`flex items-center justify-center px-3 py-2 rounded-md text-center transition-colors min-h-[40px] space-x-2 ${
                    filter === type.id
                      ? "bg-[#18243c] text-white shadow-sm"
                      : "text-black hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <span className="font-medium text-sm truncate">
                    {type.label}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full min-w-[20px] ${
                      filter === type.id
                        ? "bg-white text-[#18243c]"
                        : "bg-gray-200 text-black"
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
        <div>
            <div className="space-y-4">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => (
                  <NotificationWithStoryTitle
                    key={item.id}
                    alert={item}
                    onMarkAsRead={handleMarkAsRead}
                    isMarkingAsRead={markAsReadMutation.isPending}
                    isSelected={selectedNotifications.includes(item.id)}
                    onSelect={handleSelectNotification}
                    onDelete={handleDeleteNotification}
                    isDeleting={
                      deleteNotificationMutation.isPending &&
                      deleteNotificationMutation.variables === item.id
                    }
                  />
                ))
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No notifications found
                </h3>
                <p className="text-black">
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
  );
}

// Component to handle fetching story title and comment content for comment notifications
function NotificationWithStoryTitle({
  alert,
  onMarkAsRead,
  isMarkingAsRead,
  isSelected,
  onSelect,
  onDelete,
  isDeleting,
}: {
  alert: any;
  onMarkAsRead: (id: string) => void;
  isMarkingAsRead: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const router = useRouter();

  // For chapter comment notifications, chapter purchased notifications, and chapter liked notifications, we need to fetch chapter data first to get the story
  const shouldFetchChapter =
    (alert.isCommentNotification &&
      alert.relatedType === "CHAPTER" &&
      alert.relatedId) ||
    (alert.type === "system" &&
      alert.relatedType === "CHAPTER" &&
      alert.relatedId) ||
    (alert.isLikeNotification &&
      alert.relatedType === "CHAPTER" &&
      alert.relatedId) ||
    (alert.type === "new_chapter" &&
      alert.relatedType === "CHAPTER" &&
      alert.relatedId);
  const shouldFetchStory =
    (alert.isCommentNotification &&
      alert.relatedType === "STORY" &&
      alert.relatedId) ||
    (alert.type === "system" &&
      alert.relatedType === "STORY" &&
      alert.relatedId) ||
    (alert.isLikeNotification &&
      alert.relatedType === "STORY" &&
      alert.relatedId) ||
    (alert.type === "new_story" &&
      alert.relatedType === "STORY" &&
      alert.relatedId) ||
    (alert.type === "new_chapter" &&
      alert.relatedType === "CHAPTER" &&
      alert.relatedId);
  const shouldFetchComment =
    alert.isCommentNotification &&
    alert.relatedType === "COMMENT" &&
    alert.relatedId;
  const shouldFetchUser =
    alert.type === "follow" && alert.relatedType === "USER" && alert.relatedId;
  const shouldFetchGiftTransaction =
    alert.type === "gift_received" &&
    alert.relatedType === "GIFT" &&
    alert.relatedId;

  // Fetch chapter data if it's a chapter comment
  const { data: chapterData } = useChapter(
    alert.relatedId || "",
    !!shouldFetchChapter
  );

  // Fetch comment data if it's a comment reply notification (relatedId is the comment ID)
  const { data: commentData } = useComment(
    alert.relatedId || "",
    !!shouldFetchComment
  );

  // Fetch recent comments for chapter/story to get the latest comment content
  const { data: chapterCommentsData } = useChapterComments(
    alert.relatedId || "",
    0,
    1,
    !!shouldFetchChapter
  );

  const { data: storyCommentsData } = useStoryComments(
    alert.relatedId || "",
    0,
    1,
    !!shouldFetchStory
  );

  // Fetch user data for follower notifications
  const { data: userData } = useUser(alert.relatedId || "", !!shouldFetchUser);

  // Fetch gift transaction data for gift received notifications
  const { data: giftTransactionData } = useGiftTransaction(
    shouldFetchGiftTransaction ? alert.relatedId : null
  );

  // Fetch story data either directly or from chapter's story
  const storyId =
    shouldFetchStory && alert.relatedType === "STORY"
      ? alert.relatedId
      : chapterData?.story?.id || "";
  const { data: storyData } = useStory(
    storyId,
    !!(shouldFetchStory || (shouldFetchChapter && chapterData?.story?.id))
  );

  // Get the latest comment content (but not for like notifications or system notifications like purchases)
  let latestCommentContent = undefined;
  if (!alert.isLikeNotification && alert.type !== "system") {
    if (shouldFetchComment && commentData) {
      latestCommentContent = commentData.content;
    } else if (shouldFetchChapter && chapterCommentsData?.content?.[0]) {
      latestCommentContent = chapterCommentsData.content[0].content;
    } else if (shouldFetchStory && storyCommentsData?.content?.[0]) {
      latestCommentContent = storyCommentsData.content[0].content;
    }
  }

  // Extract liker name for like notifications and create simplified message
  let simplifiedMessage = alert.message;
  if (alert.isLikeNotification && alert.message) {
    // Handle story liked notifications: "[Name] liked your story: [Story Title]"
    const storyLikeMatch = alert.message.match(/^(.+?) liked your story:/);
    if (storyLikeMatch) {
      const likerName = storyLikeMatch[1];
      simplifiedMessage = `${likerName} liked your story`;
    } else {
      // Handle chapter liked notifications: "[Name] liked your chapter: [Chapter Title] from story: [Story Title]"
      const chapterLikeMatch = alert.message.match(
        /^(.+?) liked your chapter: (.+?) from story:/
      );
      if (chapterLikeMatch) {
        const likerName = chapterLikeMatch[1];
        const chapterTitle = chapterLikeMatch[2];
        simplifiedMessage = `${likerName} liked your chapter: ${chapterTitle}`;
      }
    }
  }

  // Handle follower notifications
  let followerData = null;
  if (alert.type === "follow" && userData) {
    followerData = {
      id: userData.id,
      displayName: userData.displayName || userData.username,
      username: userData.username,
    };
  }

  // Handle gift transaction data
  let giftData = null;
  if (alert.type === "gift_received" && giftTransactionData) {
    giftData = {
      totalCoins: giftTransactionData.totalCoins,
      senderName:
        giftTransactionData.sender.displayName ||
        giftTransactionData.sender.username,
      giftName: giftTransactionData.gift?.name || "Custom Gift",
    };
  }

  // Add story title and comment content to alert if available
  const alertWithEnhancedData = {
    ...alert,
    storyTitle: storyData ? storyData.title : undefined,
    commentContent: latestCommentContent,
    message: simplifiedMessage,
    followerData: followerData,
    giftData: giftData,
  };

  return (
    <AlertCard
      alert={alertWithEnhancedData}
      onMarkAsRead={onMarkAsRead}
      isMarkingAsRead={isMarkingAsRead}
      router={router}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
      isDeleting={isDeleting}
    />
  );
}

function AlertCard({
  alert,
  onMarkAsRead,
  isMarkingAsRead,
  router,
  isSelected,
  onSelect,
  onDelete,
  isDeleting,
}: {
  alert: any;
  onMarkAsRead: (id: string) => void;
  isMarkingAsRead: boolean;
  router?: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
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
      className={`bg-white rounded-xl border border-gray-200 p-3 sm:p-6 hover:border-gray-300 transition-all duration-300 relative ${
        !alert.isRead ? "border-l-4 border-l-[#18243c]" : ""
      }`}
    >
      <div className="flex items-start space-x-2 sm:space-x-4">
        {/* Selection Checkbox */}
        <div className="flex items-center pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(alert.id)}
            className="rounded border-gray-300 text-[#18243c] focus:ring-[#18243c]"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-12 sm:pr-20">
          {/* Mobile: Stack title and timestamp */}
          <div className="sm:hidden mb-2">
            <h4 className="text-base font-semibold text-black mb-1">
              {alert.title}
            </h4>
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <Clock className="h-3 w-3" />
              <span>{alert.timestamp}</span>
            </div>
          </div>
          {/* Desktop: Side by side */}
          <div className="hidden sm:flex items-start justify-between mb-2">
            <div>
              <h4 className="text-lg font-semibold text-black">
                {alert.title}
              </h4>
            </div>
            <div className="flex items-center space-x-2 text-sm text-black">
              <Clock className="h-4 w-4" />
              <span>{alert.timestamp}</span>
            </div>
          </div>

          {/* Message with clickable follower name for follow notifications */}
          {alert.type === "follow" && alert.followerData ? (
            <p className="text-black mb-3">
              <button
                onClick={() =>
                  router?.push(`/authors/${alert.followerData.id}`)
                }
                className="text-[#18243c] hover:text-[#0f1a2e] font-medium hover:underline"
              >
                {alert.followerData.displayName}
              </button>
              {" started following you"}
            </p>
          ) : alert.type === "gift_received" && alert.giftData ? (
            <p className="text-black mb-3">
              {alert.giftData.senderName} sent you {alert.giftData.giftName}
              <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                <DollarSign className="h-3 w-3 mr-1" />
                {alert.giftData.totalCoins} coins
              </span>
            </p>
          ) : (
            <p className="text-black mb-3">
              {alert.type === "comment" ? (
                <span>
                  {(() => {
                    const commentMatch = alert.message.match(/^(.+?) commented on your story: (.+)$/);
                    if (commentMatch) {
                      const [, username, storyTitle] = commentMatch;
                      return (
                        <>
                          <span className="font-bold">{username}</span>
                          {" commented on your story: "}
                          <span className="font-bold">{storyTitle}</span>
                        </>
                      );
                    }
                    const chapterMatch = alert.message.match(/^(.+?) commented on your chapter: (.+)$/);
                    if (chapterMatch) {
                      const [, username, chapterTitle] = chapterMatch;
                      return (
                        <>
                          <span className="font-bold">{username}</span>
                          {" commented on your chapter: "}
                          <span className="font-bold">{chapterTitle}</span>
                        </>
                      );
                    }
                    return alert.message;
                  })()
                  }
                </span>
              ) : (
                alert.message
              )}
            </p>
          )}

          {alert.commentContent && (
            <div className="mb-2 pl-2 border-l-2 border-gray-200">
              <p className="text-xs text-gray-600 leading-snug">
                {alert.commentContent}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions - Responsive positioning */}
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex items-center space-x-1 sm:space-x-2">
        {!alert.isRead && (
          <button
            onClick={() => onMarkAsRead(alert.id)}
            disabled={isMarkingAsRead}
            className="text-gray-400 hover:text-[#18243c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1 sm:p-0"
            title="Mark as read"
          >
            {isMarkingAsRead ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </button>
        )}
        <button
          onClick={() => onDelete(alert.id)}
          disabled={isDeleting}
          className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1 sm:p-0"
          title="Delete"
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
