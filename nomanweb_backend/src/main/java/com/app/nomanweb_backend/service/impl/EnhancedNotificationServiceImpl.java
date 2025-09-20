package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.entity.Notification;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.service.EmailService;
import com.app.nomanweb_backend.service.EnhancedNotificationService;
import com.app.nomanweb_backend.service.LineMessagingService;
import com.app.nomanweb_backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnhancedNotificationServiceImpl implements EnhancedNotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final LineMessagingService lineMessagingService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public Notification sendMultiChannelNotification(User user, Notification.NotificationType type,
            String title, String message,
            Notification.RelatedType relatedType, UUID relatedId) {
        return sendMultiChannelNotificationWithAction(user, type, title, message, null, relatedType, relatedId);
    }

    @Override
    public Notification sendMultiChannelNotificationWithAction(User user, Notification.NotificationType type,
            String title, String message, String actionUrl,
            Notification.RelatedType relatedType, UUID relatedId) {
        // Check if user should receive this type of notification
        if (!shouldNotifyUser(user, type)) {
            log.debug("User {} has disabled notifications for type {}", user.getId(), type);
            return null;
        }

        // Create the notification record
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .relatedType(relatedType)
                .relatedId(relatedId)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);

        // Generate action URL if not provided
        if (actionUrl == null) {
            actionUrl = generateActionUrl(type, relatedType, relatedId);
        }

        // Send email notification
        boolean emailSent = sendEmailNotification(user, type, title, message);

        // Send LINE notification
        String lineMessageId = sendLineNotification(user, type, title, message, actionUrl);

        // Update notification with LINE message ID if sent
        if (StringUtils.hasText(lineMessageId)) {
            notification.setSentViaLine(true);
            notification.setLineMessageId(lineMessageId);
            notification = notificationRepository.save(notification);
        }

        log.info("Multi-channel notification sent to user {}: email={}, line={}",
                user.getId(), emailSent, lineMessageId != null);

        // Broadcast real-time notification update via SSE
        try {
            com.app.nomanweb_backend.controller.NotificationController.broadcastNotificationUpdate(
                    user.getId(), "new_notification", notification);
        } catch (Exception e) {
            log.error("Failed to broadcast notification update via SSE for user {}: {}", user.getId(), e.getMessage());
        }

        return notification;
    }

    @Override
    public boolean sendEmailNotification(User user, Notification.NotificationType type, String title, String message) {
        if (!user.getEmailNotificationsEnabled()) {
            log.debug("Email notifications disabled for user {}", user.getId());
            return false;
        }

        try {
            switch (type) {
                case FOLLOW:
                case LIKE:
                case COMMENT:
                    emailService.sendSocialNotificationEmail(user.getEmail(), user.getUsername(), title, message);
                    break;
                case NEW_STORY:
                case NEW_CHAPTER:
                    emailService.sendContentNotificationEmail(user.getEmail(), user.getUsername(), title, message);
                    break;
                case SYSTEM:
                    emailService.sendSystemNotificationEmail(user.getEmail(), user.getUsername(), title, message);
                    break;
                default:
                    emailService.sendGeneralNotificationEmail(user.getEmail(), user.getUsername(), title, message);
                    break;
            }
            return true;
        } catch (Exception e) {
            log.error("Failed to send email notification to user {}: {}", user.getId(), e.getMessage(), e);
            return false;
        }
    }

    @Override
    public String sendLineNotification(User user, Notification.NotificationType type, String title, String message,
            String actionUrl) {
        if (!user.getLineNotificationsEnabled()) {
            log.debug("LINE notifications disabled for user {}", user.getId());
            return null;
        }

        try {
            if (StringUtils.hasText(actionUrl)) {
                return lineMessagingService.sendNotificationWithAction(user, title, message, actionUrl);
            } else {
                return lineMessagingService.sendNotification(user, title, message);
            }
        } catch (Exception e) {
            log.error("Failed to send LINE notification to user {}: {}", user.getId(), e.getMessage(), e);
            return null;
        }
    }

    @Override
    public boolean shouldNotifyUser(User user, Notification.NotificationType type) {
        if (!user.isActive()) {
            return false;
        }

        switch (type) {
            case FOLLOW:
                return user.getNotifyNewFollowers();
            case LIKE:
                return user.getNotifyLikes();
            case COMMENT:
                return user.getNotifyComments();
            case NEW_STORY:
                return user.getNotifyNewStories();
            case NEW_CHAPTER:
                return user.getNotifyNewChapters();
            case SYSTEM:
                return user.getNotifySystemMessages();
            case MODERATION:
                return user.getNotifyChapterModeration() != null ? user.getNotifyChapterModeration() : true;
            default:
                return true;
        }
    }

    @Override
    public String generateActionUrl(Notification.NotificationType type, Notification.RelatedType relatedType,
            UUID relatedId) {
        if (!StringUtils.hasText(frontendUrl) || relatedType == null || relatedId == null) {
            return frontendUrl;
        }

        switch (relatedType) {
            case STORY:
                return frontendUrl + "/stories/" + relatedId;
            case CHAPTER:
                return frontendUrl + "/chapters/" + relatedId;
            case USER:
                return frontendUrl + "/users/" + relatedId;
            case COMMENT:
                return frontendUrl + "/comments/" + relatedId;
            default:
                return frontendUrl;
        }
    }
}