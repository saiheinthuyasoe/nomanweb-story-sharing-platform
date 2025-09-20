package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.User;

public interface LineMessagingService {

    /**
     * Send a notification message to a user via LINE
     * 
     * @param user    The user to send the message to
     * @param title   The notification title
     * @param message The notification message
     * @return The LINE message ID if successful, null if failed
     */
    String sendNotification(User user, String title, String message);

    /**
     * Send a notification with action buttons to a user via LINE
     * 
     * @param user      The user to send the message to
     * @param title     The notification title
     * @param message   The notification message
     * @param actionUrl Optional action URL for "View" button
     * @return The LINE message ID if successful, null if failed
     */
    String sendNotificationWithAction(User user, String title, String message, String actionUrl);

    /**
     * Send a notification with story cover image to a user via LINE
     * 
     * @param user          The user to send the message to
     * @param title         The notification title
     * @param message       The notification message
     * @param coverImageUrl The story cover image URL
     * @param actionUrl     Optional action URL for "View" button
     * @return The LINE message ID if successful, null if failed
     */
    String sendNotificationWithImage(User user, String title, String message, String coverImageUrl, String actionUrl);

    /**
     * Check if user has LINE integration enabled and can receive LINE notifications
     * 
     * @param user The user to check
     * @return true if user can receive LINE notifications
     */
    boolean canSendLineNotification(User user);

    /**
     * Send a welcome message to a new LINE user
     * 
     * @param user The user who just connected their LINE account
     * @return The LINE message ID if successful, null if failed
     */
    String sendWelcomeMessage(User user);

    /**
     * Send a system announcement to a user via LINE
     * 
     * @param user    The user to send the announcement to
     * @param title   The announcement title
     * @param message The announcement message
     * @return The LINE message ID if successful, null if failed
     */
    String sendSystemAnnouncement(User user, String title, String message);
}