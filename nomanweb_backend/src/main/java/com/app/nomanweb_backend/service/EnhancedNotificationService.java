package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.Notification;
import com.app.nomanweb_backend.entity.User;

import java.util.UUID;

public interface EnhancedNotificationService {

        /**
         * Send a LINE notification with story cover image to a user
         * 
         * @param user          The user to send the notification to
         * @param type          The notification type
         * @param title         The notification title
         * @param message       The notification message
         * @param coverImageUrl The story cover image URL
         * @param actionUrl     Optional action URL for "View" button
         * @return The LINE message ID if successful, null if failed
         */
        String sendLineNotificationWithImage(User user, Notification.NotificationType type, String title,
                        String message,
                        String coverImageUrl, String actionUrl);

        /**
         * Send notification via all enabled channels (email and LINE) based on user
         * preferences
         * 
         * @param user        The user to notify
         * @param type        The notification type
         * @param title       The notification title
         * @param message     The notification message
         * @param relatedType The related entity type (optional)
         * @param relatedId   The related entity ID (optional)
         * @return The created notification entity
         */
        Notification sendMultiChannelNotification(User user, Notification.NotificationType type,
                        String title, String message,
                        Notification.RelatedType relatedType, UUID relatedId);

        /**
         * Send notification with action URL for LINE notifications
         * 
         * @param user        The user to notify
         * @param type        The notification type
         * @param title       The notification title
         * @param message     The notification message
         * @param actionUrl   The action URL for LINE notifications
         * @param relatedType The related entity type (optional)
         * @param relatedId   The related entity ID (optional)
         * @return The created notification entity
         */
        Notification sendMultiChannelNotificationWithAction(User user, Notification.NotificationType type,
                        String title, String message, String actionUrl,
                        Notification.RelatedType relatedType, UUID relatedId);

        /**
         * Send email notification if user has email notifications enabled
         * 
         * @param user    The user to notify
         * @param type    The notification type
         * @param title   The notification title
         * @param message The notification message
         * @return true if email was sent successfully
         */
        boolean sendEmailNotification(User user, Notification.NotificationType type, String title, String message);

        /**
         * Send LINE notification if user has LINE notifications enabled
         * 
         * @param user      The user to notify
         * @param type      The notification type
         * @param title     The notification title
         * @param message   The notification message
         * @param actionUrl Optional action URL
         * @return The LINE message ID if sent successfully, null otherwise
         */
        String sendLineNotification(User user, Notification.NotificationType type, String title, String message,
                        String actionUrl);

        /**
         * Check if user should receive notifications of the given type
         * 
         * @param user The user to check
         * @param type The notification type
         * @return true if user should receive this type of notification
         */
        boolean shouldNotifyUser(User user, Notification.NotificationType type);

        /**
         * Generate action URL for notification based on type and related entities
         * 
         * @param type        The notification type
         * @param relatedType The related entity type
         * @param relatedId   The related entity ID
         * @return The action URL or null if not applicable
         */
        String generateActionUrl(Notification.NotificationType type, Notification.RelatedType relatedType,
                        UUID relatedId);
}