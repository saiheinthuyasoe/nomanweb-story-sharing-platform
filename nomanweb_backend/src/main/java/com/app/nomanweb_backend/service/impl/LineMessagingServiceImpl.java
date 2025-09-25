package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.service.LineMessagingService;
import com.linecorp.bot.client.LineMessagingClient;
import com.linecorp.bot.model.PushMessage;
import com.linecorp.bot.model.message.FlexMessage;
import com.linecorp.bot.model.message.ImageMessage;
import com.linecorp.bot.model.message.TextMessage;
import com.linecorp.bot.model.message.flex.container.Bubble;
import com.linecorp.bot.model.message.flex.component.Box;
import com.linecorp.bot.model.message.flex.component.Button;
import com.linecorp.bot.model.message.flex.component.Text;
import com.linecorp.bot.model.message.flex.unit.FlexFontSize;
import com.linecorp.bot.model.message.flex.unit.FlexLayout;
import com.linecorp.bot.model.message.flex.unit.FlexMarginSize;
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
    public String sendNotificationWithImage(User user, String title, String message, String coverImageUrl, String actionUrl) {
        try {
            if (!canSendLineNotification(user)) {
                log.warn("Cannot send LINE notification to user {}: LINE notifications disabled or LINE User ID not set", user.getId());
                return "User does not have LINE notifications enabled or LINE User ID not set";
            }

            // Validate image URL
            if (!StringUtils.hasText(coverImageUrl)) {
                log.warn("Cover image URL is empty for user {}, falling back to text notification", user.getId());
                return sendNotification(user, title, message);
            }

            log.info("Sending LINE notification with image to user: {} (LINE ID: {})", user.getId(), user.getLineUserId());
            log.debug("Cover image URL: {}, Action URL: {}", coverImageUrl, actionUrl);

            // Create Flex Message with book cover layout (cover on left, info on right)
            Bubble bubble = Bubble.builder()
                    .body(Box.builder()
                            .layout(FlexLayout.HORIZONTAL)
                            .contents(Arrays.asList(
                                    // Left side - Book cover image (vertical rectangle)
                                    com.linecorp.bot.model.message.flex.component.Image.builder()
                                            .url(java.net.URI.create(coverImageUrl))
                                            .flex(1)
                                            .size(com.linecorp.bot.model.message.flex.component.Image.ImageSize.FULL_WIDTH)
                                            .aspectRatio(com.linecorp.bot.model.message.flex.component.Image.ImageAspectRatio.R3TO4)
                                            .aspectMode(com.linecorp.bot.model.message.flex.component.Image.ImageAspectMode.Cover)
                                            .build(),
                                    // Right side - Book information and button
                                    Box.builder()
                                            .layout(FlexLayout.VERTICAL)
                                            .flex(2)
                                            .paddingStart("md")
                                            .contents(Arrays.asList(
                                                    Text.builder()
                                                            .text(title)
                                                            .weight(com.linecorp.bot.model.message.flex.component.Text.TextWeight.BOLD)
                                                            .size(FlexFontSize.LG)
                                                            .wrap(true)
                                                            .maxLines(2)
                                                            .build(),
                                                    Text.builder()
                                                            .text(message)
                                                            .size(FlexFontSize.SM)
                                                            .color("#666666")
                                                            .wrap(true)
                                                            .maxLines(3)
                                                            .margin(FlexMarginSize.SM)
                                                            .build(),
                                                    // View button with custom color
                                                    StringUtils.hasText(actionUrl) ? 
                                                            Button.builder()
                                                                    .style(Button.ButtonStyle.PRIMARY)
                                                                    .color("#18243c")
                                                                    .action(new URIAction("View", java.net.URI.create(actionUrl), null))
                                                                    .margin(FlexMarginSize.MD)
                                                                    .build() : null
                                            ))
                                            .build()
                            ))
                            .build())
                    .build();

            FlexMessage flexMessage = new FlexMessage(title, bubble);
            PushMessage pushMessage = new PushMessage(user.getLineUserId(), flexMessage);

            CompletableFuture<BotApiResponse> future = lineMessagingClient.pushMessage(pushMessage);
            BotApiResponse response = future.get();

            if (response.getMessage() != null) {
                log.warn("LINE API warning for user {}: {}", user.getId(), response.getMessage());
            }

            log.info("Successfully sent LINE notification with image to user: {} (LINE ID: {})", user.getId(), user.getLineUserId());
            return "LINE notification with image sent successfully";

        } catch (java.util.concurrent.ExecutionException e) {
            Throwable cause = e.getCause();
            log.error("LINE API execution error for user {}: {}", 
                user.getId(), cause != null ? cause.getMessage() : e.getMessage(), e);
            
            // Fallback to text notification for recoverable errors
            log.info("Falling back to text notification for user: {}", user.getId());
            return sendNotification(user, title, message);
        } catch (Exception e) {
            log.error("Unexpected error sending LINE notification with image to user {}: {}", 
                user.getId(), e.getMessage(), e);
            // Fallback to text notification
            log.info("Falling back to text notification for user: {}", user.getId());
            return sendNotification(user, title, message);
        }
    }

    @Override
    public String sendNotification(User user, String title, String message) {
        if (!canSendLineNotification(user)) {
            log.warn("Cannot send LINE notification to user {}: LINE notifications disabled or LINE User ID not set", user.getId());
            return null;
        }

        try {
            log.info("Sending LINE text notification to user: {} (LINE ID: {})", user.getId(), user.getLineUserId());
            log.debug("Notification content - Title: {}, Message: {}", title, message);

            TextMessage textMessage = new TextMessage(title + "\n" + message);
            PushMessage pushMessage = new PushMessage(user.getLineUserId(), textMessage);

            CompletableFuture<BotApiResponse> future = lineMessagingClient.pushMessage(pushMessage);
            BotApiResponse response = future.get();

            if (response.getMessage() != null) {
                log.warn("LINE API warning for user {}: {}", user.getId(), response.getMessage());
            }

            log.info("Successfully sent LINE text notification to user: {} (LINE ID: {})", user.getId(), user.getLineUserId());
            return "line_message_" + System.currentTimeMillis(); // Generate a simple message ID
        } catch (java.util.concurrent.ExecutionException e) {
            Throwable cause = e.getCause();
            log.error("Execution error sending LINE text notification to user {}: {}", 
                user.getId(), cause != null ? cause.getMessage() : e.getMessage(), e);
            return null;
        } catch (Exception e) {
            log.error("Unexpected error sending LINE text notification to user {}: {}", 
                user.getId(), e.getMessage(), e);
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