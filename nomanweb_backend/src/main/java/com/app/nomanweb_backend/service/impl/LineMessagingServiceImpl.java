package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.service.LineMessagingService;
import com.linecorp.bot.client.LineMessagingClient;
import com.linecorp.bot.model.PushMessage;
import com.linecorp.bot.model.message.FlexMessage;
import com.linecorp.bot.model.message.TextMessage;
import com.linecorp.bot.model.message.flex.container.Bubble;
import com.linecorp.bot.model.message.flex.component.Box;
import com.linecorp.bot.model.message.flex.component.Button;
import com.linecorp.bot.model.message.flex.component.Text;
import com.linecorp.bot.model.action.URIAction;
import com.linecorp.bot.model.response.BotApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class LineMessagingServiceImpl implements LineMessagingService {

    private final LineMessagingClient lineMessagingClient;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public String sendNotification(User user, String title, String message) {
        if (!canSendLineNotification(user)) {
            log.debug("Cannot send LINE notification to user {}: LINE not enabled or no LINE user ID", user.getId());
            return null;
        }

        try {
            TextMessage textMessage = new TextMessage(title + "\n" + message);

            PushMessage pushMessage = new PushMessage(user.getLineUserId(), textMessage);

            CompletableFuture<BotApiResponse> future = lineMessagingClient.pushMessage(pushMessage);
            BotApiResponse response = future.get();

            if (response.getMessage() != null) {
                log.warn("LINE API warning for user {}: {}", user.getId(), response.getMessage());
            }

            log.info("Successfully sent LINE notification to user: {}", user.getId());
            return "line_message_" + System.currentTimeMillis(); // Generate a simple message ID
        } catch (Exception e) {
            log.error("Failed to send LINE notification to user {}: {}", user.getId(), e.getMessage(), e);
            return null;
        }
    }

    @Override
    public String sendNotificationWithAction(User user, String title, String message, String actionUrl) {
        if (!canSendLineNotification(user)) {
            log.debug("Cannot send LINE notification to user {}: LINE not enabled or no LINE user ID", user.getId());
            return null;
        }

        try {
            // Create Flex Message with action button
            // Simplified approach - use TextMessage instead of complex FlexMessage for compatibility
            String messageText = String.format("📢 %s\n\n%s", title, message);
            if (StringUtils.hasText(actionUrl)) {
                messageText += "\n\n🔗 " + actionUrl;
            }
            
            TextMessage textMessage = new TextMessage(messageText);
            PushMessage pushMessage = new PushMessage(user.getLineUserId(), textMessage);

            CompletableFuture<BotApiResponse> future = lineMessagingClient.pushMessage(pushMessage);
            BotApiResponse response = future.get();

            if (response.getMessage() != null) {
                log.warn("LINE API warning for user {}: {}", user.getId(), response.getMessage());
            }

            log.info("Successfully sent LINE notification with action to user: {}", user.getId());
            return "line_message_" + System.currentTimeMillis();
        } catch (Exception e) {
            log.error("Failed to send LINE notification with action to user {}: {}", user.getId(), e.getMessage(), e);
            return null;
        }
    }

    @Override
    public boolean canSendLineNotification(User user) {
        return user != null
                && StringUtils.hasText(user.getLineUserId())
                && Boolean.TRUE.equals(user.getLineNotificationsEnabled())
                && user.isActive();
    }

    @Override
    public String sendWelcomeMessage(User user) {
        if (!StringUtils.hasText(user.getLineUserId())) {
            return null;
        }

        String welcomeTitle = "Welcome to NoManWeb! 🎉";
        String welcomeMessage = String.format(
                "Hello %s!\n\n" +
                        "Your LINE account has been successfully connected to NoManWeb.\n\n" +
                        "You'll now receive notifications for:\n" +
                        "📚 New chapters from authors you follow\n" +
                        "💬 Comments and replies\n" +
                        "❤️ Likes on your content\n" +
                        "👥 New followers\n" +
                        "🔔 System announcements\n\n" +
                        "You can manage your notification preferences in your account settings.",
                user.getDisplayNameOrUsername());

        return sendNotificationWithAction(user, welcomeTitle, welcomeMessage, frontendUrl + "/settings/notifications");
    }

    @Override
    public String sendSystemAnnouncement(User user, String title, String message) {
        if (!canSendLineNotification(user) || !Boolean.TRUE.equals(user.getNotifySystemMessages())) {
            return null;
        }

        String systemTitle = "🔔 System Announcement: " + title;
        return sendNotificationWithAction(user, systemTitle, message, frontendUrl);
    }
}