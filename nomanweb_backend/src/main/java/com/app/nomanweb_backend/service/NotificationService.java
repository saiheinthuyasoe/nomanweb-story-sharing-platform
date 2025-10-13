package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.Notification;
import com.app.nomanweb_backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface NotificationService {

        // Basic notification operations
        Notification createNotification(UUID userId, Notification.NotificationType type,
                        String title, String message,
                        Notification.RelatedType relatedType, UUID relatedId);

        Notification createNotification(User user, Notification.NotificationType type,
                        String title, String message,
                        Notification.RelatedType relatedType, UUID relatedId);

        Notification updateNotification(Notification notification);

        Page<Notification> getUserNotifications(UUID userId, Pageable pageable);

        Page<Notification> getUnreadNotifications(UUID userId, Pageable pageable);

        long getUnreadCount(UUID userId);

        void markAsRead(UUID notificationId);

        void markAllAsRead(UUID userId);

        void deleteNotification(UUID notificationId);

        void bulkDeleteNotifications(List<UUID> notificationIds, UUID userId);

        // Social notifications
        void notifyNewFollower(UUID followedUserId, UUID followerUserId);

        void notifyNewStory(UUID authorId, UUID storyId);

        void notifyNewChapter(UUID authorId, UUID storyId, UUID chapterId);

        void notifyStoryLike(UUID storyAuthorId, UUID likerId, UUID storyId);

        void notifyChapterLike(UUID chapterAuthorId, UUID likerId, UUID chapterId);

        void notifyCommentLike(UUID commentAuthorId, UUID likerId, UUID commentId);

        void notifyNewComment(UUID contentAuthorId, UUID commenterId, UUID storyId, UUID chapterId, UUID commentId);

        void notifyCommentReply(UUID parentCommentAuthorId, UUID replierId, UUID commentId);

        // Batch operations
        void sendNotificationsToFollowers(UUID authorId, String title, String message,
                        Notification.NotificationType type,
                        Notification.RelatedType relatedType, UUID relatedId);

        // System notifications
        void sendSystemNotification(UUID userId, String title, String message);

        void sendBulkSystemNotification(List<UUID> userIds, String title, String message);

        // Moderation notifications
        void sendModerationNotification(UUID userId, String title, String message,
                        Notification.RelatedType relatedType, UUID relatedId);

        // Send notification to all admin users
        void sendNotificationToAdmins(String title, String message,
                        Notification.RelatedType relatedType, UUID relatedId);

        // Cleanup and statistics
        void cleanupOldNotifications(int daysToKeep);

        // Statistics
        Map<String, Long> getNotificationStats(UUID userId);
}