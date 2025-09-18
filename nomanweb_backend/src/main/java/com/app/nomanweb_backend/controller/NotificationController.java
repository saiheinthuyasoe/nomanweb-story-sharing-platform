package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.Notification;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.service.NotificationService;
import com.app.nomanweb_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    // SSE emitters for notification updates
    public static final Map<UUID, SseEmitter> notificationEmitters = new ConcurrentHashMap<>();

    // SSE endpoint for notification updates
    @GetMapping(value = "/sse/updates", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToNotificationUpdates(HttpServletRequest request) {
        try {
            UUID userId = getCurrentUserId();
            SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

            // Store emitter for this user
            notificationEmitters.put(userId, emitter);
            log.info("✅ User {} connected to notification SSE updates. Total connections: {}", userId,
                    notificationEmitters.size());

            // Send initial connection message
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("message", "Connected to notification updates", "userId", userId.toString())));

            // Handle client disconnect
            emitter.onCompletion(() -> {
                notificationEmitters.remove(userId);
                log.info("Notification SSE connection closed for user: {}", userId);
            });

            emitter.onTimeout(() -> {
                notificationEmitters.remove(userId);
                log.info("Notification SSE connection timeout for user: {}", userId);
            });

            emitter.onError((ex) -> {
                notificationEmitters.remove(userId);
                log.error("Notification SSE connection error for user: {}", userId, ex);
            });

            log.info("User {} subscribed to notification updates", userId);
            return emitter;
        } catch (Exception e) {
            log.error("Error creating notification SSE connection", e);
            throw new RuntimeException("Failed to create notification SSE connection", e);
        }
    }

    // Broadcast notification update to specific user
    public static void broadcastNotificationUpdate(UUID userId, String type, Object data) {
        SseEmitter emitter = notificationEmitters.get(userId);
        log.info("Attempting to broadcast notification update to user {}: {}", userId, type);

        if (emitter != null) {
            try {
                Map<String, Object> update = new HashMap<>();
                update.put("type", type);
                update.put("userId", userId.toString());
                update.put("data", data);
                update.put("timestamp", LocalDateTime.now());

                emitter.send(SseEmitter.event()
                        .name("notification_update")
                        .data(update));

                log.info("✅ Successfully broadcasted notification update to user {}: {}", userId, type);
            } catch (IOException e) {
                log.error("❌ Error broadcasting notification update to user: {}", userId, e);
                notificationEmitters.remove(userId);
            }
        } else {
            log.warn("⚠️ No notification SSE emitter found for user: {}. User may not be connected to SSE endpoint.",
                    userId);
        }
    }

    @GetMapping
    public ResponseEntity<Page<Notification>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            UUID userId = getCurrentUserId();
            Pageable pageable = PageRequest.of(page, size);
            Page<Notification> notifications = notificationService.getUserNotifications(userId, pageable);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Error getting notifications", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/unread")
    public ResponseEntity<Page<Notification>> getUnreadNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            UUID userId = getCurrentUserId();
            Pageable pageable = PageRequest.of(page, size);
            Page<Notification> notifications = notificationService.getUnreadNotifications(userId, pageable);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Error getting unread notifications", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        try {
            UUID userId = getCurrentUserId();
            long unreadCount = notificationService.getUnreadCount(userId);
            return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
        } catch (Exception e) {
            log.error("Error getting unread count", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable UUID notificationId) {
        try {
            UUID userId = getCurrentUserId();
            notificationService.markAsRead(notificationId);

            // Broadcast the read status update
            broadcastNotificationUpdate(userId, "notification_read",
                    Map.of("notificationId", notificationId.toString()));

            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (Exception e) {
            log.error("Error marking notification as read", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Map<String, String>> markAllAsRead() {
        try {
            UUID userId = getCurrentUserId();
            notificationService.markAllAsRead(userId);

            // Broadcast the mark all read update
            broadcastNotificationUpdate(userId, "all_notifications_read", Map.of("userId", userId.toString()));

            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception e) {
            log.error("Error marking all notifications as read", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<Map<String, String>> bulkDeleteNotifications(@RequestBody Map<String, Object> request) {
        try {
            UUID userId = getCurrentUserId();
            @SuppressWarnings("unchecked")
            List<String> notificationIdStrings = (List<String>) request.get("notificationIds");

            if (notificationIdStrings == null || notificationIdStrings.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No notification IDs provided"));
            }

            List<UUID> notificationIds = notificationIdStrings.stream()
                    .map(UUID::fromString)
                    .toList();

            notificationService.bulkDeleteNotifications(notificationIds, userId);
            return ResponseEntity.ok(Map.of("message", "Notifications deleted successfully"));
        } catch (Exception e) {
            log.error("Error bulk deleting notifications", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to delete notifications"));
        }
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable UUID notificationId) {
        try {
            notificationService.deleteNotification(notificationId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting notification", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getNotificationStats() {
        try {
            UUID userId = getCurrentUserId();
            Map<String, Long> stats = notificationService.getNotificationStats(userId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting notification stats", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Test endpoint for sending system notifications (admin only)
    @PostMapping("/system")
    public ResponseEntity<Map<String, String>> sendSystemNotification(
            @RequestBody Map<String, String> request) {
        try {
            UUID userId = getCurrentUserId();
            String title = request.get("title");
            String message = request.get("message");

            if (title == null || message == null) {
                return ResponseEntity.badRequest().build();
            }

            notificationService.sendSystemNotification(userId, title, message);
            return ResponseEntity.ok(Map.of("message", "System notification sent"));
        } catch (Exception e) {
            log.error("Error sending system notification", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get current user's notification preferences
    @GetMapping("/preferences")
    public ResponseEntity<Map<String, Object>> getNotificationPreferences() {
        try {
            UUID userId = getCurrentUserId();
            User user = userService.getUserById(userId);

            Map<String, Object> preferences = Map.of(
                    "emailNotificationsEnabled", user.getEmailNotificationsEnabled(),
                    "lineNotificationsEnabled", user.getLineNotificationsEnabled(),
                    "notifyNewFollowers", user.getNotifyNewFollowers(),
                    "notifyNewStories", user.getNotifyNewStories(),
                    "notifyNewChapters", user.getNotifyNewChapters(),
                    "notifyLikes", user.getNotifyLikes(),
                    "notifyComments", user.getNotifyComments(),
                    "notifySystemMessages", user.getNotifySystemMessages(),
                    "notifyChapterModeration", user.getNotifyChapterModeration());

            return ResponseEntity.ok(preferences);
        } catch (Exception e) {
            log.error("Error getting notification preferences", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Update current user's notification preferences
    @PutMapping("/preferences")
    public ResponseEntity<Map<String, Object>> updateNotificationPreferences(
            @RequestBody Map<String, Object> request) {
        try {
            UUID userId = getCurrentUserId();
            User user = userService.getUserById(userId);

            // Handle single preference update with type and enabled fields
            if (request.containsKey("type") && request.containsKey("enabled")) {
                String type = (String) request.get("type");
                Boolean enabled = (Boolean) request.get("enabled");

                switch (type) {
                    case "CHAPTER_MODERATION":
                        user.setNotifyChapterModeration(enabled);
                        break;
                    case "NEW_FOLLOWER":
                        user.setNotifyNewFollowers(enabled);
                        break;
                    case "STORY_LIKE":
                    case "CHAPTER_LIKE":
                        user.setNotifyLikes(enabled);
                        break;
                    case "NEW_CHAPTER":
                        user.setNotifyNewChapters(enabled);
                        break;
                    case "NEW_STORY":
                        user.setNotifyNewStories(enabled);
                        break;
                    case "SYSTEM_MESSAGE":
                        user.setNotifySystemMessages(enabled);
                        break;
                    default:
                        return ResponseEntity.badRequest()
                                .body(Map.of("error", "Invalid notification type: " + type));
                }
            } else {
                // Handle bulk preference update
                Boolean emailEnabled = (Boolean) request.get("emailNotificationsEnabled");
                Boolean lineEnabled = (Boolean) request.get("lineNotificationsEnabled");
                Boolean notifyNewFollowers = (Boolean) request.get("notifyNewFollowers");
                Boolean notifyNewStories = (Boolean) request.get("notifyNewStories");
                Boolean notifyNewChapters = (Boolean) request.get("notifyNewChapters");
                Boolean notifyLikes = (Boolean) request.get("notifyLikes");
                Boolean notifyComments = (Boolean) request.get("notifyComments");
                Boolean notifySystemMessages = (Boolean) request.get("notifySystemMessages");
                Boolean notifyChapterModeration = (Boolean) request.get("notifyChapterModeration");

                if (emailEnabled != null)
                    user.setEmailNotificationsEnabled(emailEnabled);
                if (lineEnabled != null)
                    user.setLineNotificationsEnabled(lineEnabled);
                if (notifyNewFollowers != null)
                    user.setNotifyNewFollowers(notifyNewFollowers);
                if (notifyNewStories != null)
                    user.setNotifyNewStories(notifyNewStories);
                if (notifyNewChapters != null)
                    user.setNotifyNewChapters(notifyNewChapters);
                if (notifyLikes != null)
                    user.setNotifyLikes(notifyLikes);
                if (notifyComments != null)
                    user.setNotifyComments(notifyComments);
                if (notifySystemMessages != null)
                    user.setNotifySystemMessages(notifySystemMessages);
                if (notifyChapterModeration != null)
                    user.setNotifyChapterModeration(notifyChapterModeration);
            }

            User updatedUser = userService.updateUser(user);

            Map<String, Object> response = Map.of(
                    "message", "Notification preferences updated successfully",
                    "preferences", Map.of(
                            "emailNotificationsEnabled", updatedUser.getEmailNotificationsEnabled(),
                            "lineNotificationsEnabled", updatedUser.getLineNotificationsEnabled(),
                            "notifyNewFollowers", updatedUser.getNotifyNewFollowers(),
                            "notifyNewStories", updatedUser.getNotifyNewStories(),
                            "notifyNewChapters", updatedUser.getNotifyNewChapters(),
                            "notifyLikes", updatedUser.getNotifyLikes(),
                            "notifyComments", updatedUser.getNotifyComments(),
                            "notifySystemMessages", updatedUser.getNotifySystemMessages(),
                            "notifyChapterModeration", updatedUser.getNotifyChapterModeration()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating notification preferences", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to update notification preferences"));
        }
    }

    // Update specific notification preference
    @PatchMapping("/preferences/{preferenceType}")
    public ResponseEntity<Map<String, Object>> updateSpecificPreference(
            @PathVariable String preferenceType,
            @RequestBody Map<String, Boolean> request) {
        try {
            UUID userId = getCurrentUserId();
            Boolean enabled = request.get("enabled");

            if (enabled == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "'enabled' field is required"));
            }

            User user = userService.getUserById(userId);

            switch (preferenceType.toLowerCase()) {
                case "email":
                    user.setEmailNotificationsEnabled(enabled);
                    break;
                case "line":
                    user.setLineNotificationsEnabled(enabled);
                    break;
                default:
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Invalid preference type. Use 'email' or 'line'"));
            }

            User updatedUser = userService.updateUser(user);

            Map<String, Object> response = Map.of(
                    "message", String.format("%s notifications %s",
                            preferenceType.substring(0, 1).toUpperCase() + preferenceType.substring(1),
                            enabled ? "enabled" : "disabled"),
                    "preferences", Map.of(
                            "emailNotificationsEnabled", updatedUser.getEmailNotificationsEnabled(),
                            "lineNotificationsEnabled", updatedUser.getLineNotificationsEnabled()));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating specific notification preference", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to update notification preference"));
        }
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getPrincipal().equals("anonymousUser")) {
            return UUID.fromString(authentication.getName());
        }
        throw new RuntimeException("No authenticated user found");
    }
}