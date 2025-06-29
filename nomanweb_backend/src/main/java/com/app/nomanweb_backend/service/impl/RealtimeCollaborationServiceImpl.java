package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.collaboration.RealtimeCollaborationMessage;
import com.app.nomanweb_backend.service.CollaborationService;
import com.app.nomanweb_backend.service.RealtimeCollaborationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import javax.annotation.PostConstruct;

@Service
@RequiredArgsConstructor
@Slf4j
public class RealtimeCollaborationServiceImpl implements RealtimeCollaborationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final CollaborationService collaborationService;

    // Track active users per chapter
    private final ConcurrentMap<UUID, ConcurrentMap<UUID, UserSession>> activeUsers = new ConcurrentHashMap<>();

    // User colors for cursor visualization
    private static final String[] USER_COLORS = {
            "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
            "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
    };

    @PostConstruct
    public void logInitialization() {
        log.info("RealtimeCollaborationServiceImpl initialized successfully");
    }

    @Override
    public void broadcastContentUpdate(UUID chapterId, UUID userId, String content, Integer position, Integer length,
            String operation) {
        try {
            log.info(
                    "Received content update request: chapterId={}, userId={}, contentLength={}, position={}, length={}, operation={}",
                    chapterId, userId, content != null ? content.length() : 0, position, length, operation);

            // Verify user has edit permissions
            boolean hasPermission = collaborationService.hasEditPermission(chapterId, userId);
            log.info("User {} has edit permission for chapter {}: {}", userId, chapterId, hasPermission);

            if (!hasPermission) {
                log.warn("User {} attempted to broadcast content update without edit permissions for chapter {}",
                        userId, chapterId);
                return;
            }

            RealtimeCollaborationMessage message = RealtimeCollaborationMessage.builder()
                    .type(RealtimeCollaborationMessage.MessageType.CONTENT_UPDATE)
                    .chapterId(chapterId)
                    .userId(userId)
                    .content(content)
                    .position(position)
                    .length(length)
                    .operation(operation)
                    .timestamp(LocalDateTime.now())
                    .build();

            // Broadcast to all collaborators of this chapter
            String destination = "/topic/chapter/" + chapterId + "/content";
            log.info("Broadcasting content update to destination: {}", destination);
            messagingTemplate.convertAndSend(destination, message);

            log.info(
                    "Successfully broadcasted content update for chapter {} from user {}: operation={}, position={}, length={}",
                    chapterId, userId, operation, position, length);
        } catch (Exception e) {
            log.error("Error broadcasting content update for chapter {} from user {}", chapterId, userId, e);
        }
    }

    @Override
    public void broadcastCursorPosition(UUID chapterId, UUID userId, Integer cursorPosition) {
        try {
            // Verify user has access to the chapter
            if (!collaborationService.hasAccessToChapter(chapterId, userId)) {
                return;
            }

            RealtimeCollaborationMessage message = RealtimeCollaborationMessage.builder()
                    .type(RealtimeCollaborationMessage.MessageType.CURSOR_POSITION)
                    .chapterId(chapterId)
                    .userId(userId)
                    .cursorPosition(cursorPosition)
                    .timestamp(LocalDateTime.now())
                    .build();

            // Broadcast to other collaborators (not to the sender)
            messagingTemplate.convertAndSend("/topic/chapter/" + chapterId + "/cursor", message);

            log.debug("Broadcasted cursor position for chapter {} from user {}: position={}",
                    chapterId, userId, cursorPosition);
        } catch (Exception e) {
            log.error("Error broadcasting cursor position for chapter {} from user {}", chapterId, userId, e);
        }
    }

    @Override
    public void broadcastSelectionRange(UUID chapterId, UUID userId, Integer selectionStart, Integer selectionEnd) {
        try {
            // Verify user has access to the chapter
            if (!collaborationService.hasAccessToChapter(chapterId, userId)) {
                return;
            }

            RealtimeCollaborationMessage message = RealtimeCollaborationMessage.builder()
                    .type(RealtimeCollaborationMessage.MessageType.SELECTION_RANGE)
                    .chapterId(chapterId)
                    .userId(userId)
                    .selectionStart(selectionStart)
                    .selectionEnd(selectionEnd)
                    .timestamp(LocalDateTime.now())
                    .build();

            // Broadcast to other collaborators (not to the sender)
            messagingTemplate.convertAndSend("/topic/chapter/" + chapterId + "/selection", message);

            log.debug("Broadcasted selection range for chapter {} from user {}: start={}, end={}",
                    chapterId, userId, selectionStart, selectionEnd);
        } catch (Exception e) {
            log.error("Error broadcasting selection range for chapter {} from user {}", chapterId, userId, e);
        }
    }

    @Override
    public void notifyUserJoined(UUID chapterId, UUID userId, String username, String displayName,
            String profileImageUrl) {
        try {
            // Verify user has access to the chapter
            if (!collaborationService.hasAccessToChapter(chapterId, userId)) {
                return;
            }

            // Get existing users before adding the new user
            ConcurrentMap<UUID, UserSession> chapterUsers = activeUsers.get(chapterId);

            // Send existing users to the newly joined user
            if (chapterUsers != null && !chapterUsers.isEmpty()) {
                for (UserSession existingUser : chapterUsers.values()) {
                    RealtimeCollaborationMessage existingUserMessage = RealtimeCollaborationMessage.builder()
                            .type(RealtimeCollaborationMessage.MessageType.USER_JOINED)
                            .chapterId(chapterId)
                            .userId(existingUser.userId)
                            .username(existingUser.username)
                            .displayName(existingUser.displayName)
                            .profileImageUrl(existingUser.profileImageUrl)
                            .color(existingUser.color)
                            .timestamp(LocalDateTime.now())
                            .build();

                    // Send to the newly joined user only
                    messagingTemplate.convertAndSendToUser(
                            userId.toString(),
                            "/queue/presence",
                            existingUserMessage);
                }
                log.info("Sent {} existing users to newly joined user {}", chapterUsers.size(), username);
            }

            // Add user to active users
            activeUsers.computeIfAbsent(chapterId, k -> new ConcurrentHashMap<>())
                    .put(userId,
                            new UserSession(userId, username, displayName, profileImageUrl, getNextColor(chapterId)));

            RealtimeCollaborationMessage message = RealtimeCollaborationMessage.builder()
                    .type(RealtimeCollaborationMessage.MessageType.USER_JOINED)
                    .chapterId(chapterId)
                    .userId(userId)
                    .username(username)
                    .displayName(displayName)
                    .profileImageUrl(profileImageUrl)
                    .color(getUserColor(chapterId, userId))
                    .timestamp(LocalDateTime.now())
                    .build();

            // Broadcast to all collaborators (including the new user)
            messagingTemplate.convertAndSend("/topic/chapter/" + chapterId + "/presence", message);

            log.info("User {} joined chapter {} collaboration", username, chapterId);
        } catch (Exception e) {
            log.error("Error notifying user joined for chapter {} user {}", chapterId, userId, e);
        }
    }

    @Override
    public void notifyUserLeft(UUID chapterId, UUID userId) {
        try {
            // Remove user from active users
            ConcurrentMap<UUID, UserSession> chapterUsers = activeUsers.get(chapterId);
            if (chapterUsers != null) {
                UserSession session = chapterUsers.remove(userId);
                if (session != null) {
                    RealtimeCollaborationMessage message = RealtimeCollaborationMessage.builder()
                            .type(RealtimeCollaborationMessage.MessageType.USER_LEFT)
                            .chapterId(chapterId)
                            .userId(userId)
                            .username(session.username)
                            .displayName(session.displayName)
                            .timestamp(LocalDateTime.now())
                            .build();

                    // Broadcast to remaining collaborators
                    messagingTemplate.convertAndSend("/topic/chapter/" + chapterId + "/presence", message);

                    log.info("User {} left chapter {} collaboration", session.username, chapterId);
                }
            }
        } catch (Exception e) {
            log.error("Error notifying user left for chapter {} user {}", chapterId, userId, e);
        }
    }

    @Override
    public void updatePresence(UUID chapterId, UUID userId, boolean isOnline) {
        try {
            // Verify user has access to the chapter
            if (!collaborationService.hasAccessToChapter(chapterId, userId)) {
                return;
            }

            ConcurrentMap<UUID, UserSession> chapterUsers = activeUsers.get(chapterId);
            if (chapterUsers != null) {
                UserSession session = chapterUsers.get(userId);
                if (session != null) {
                    session.lastSeen = LocalDateTime.now();
                    session.isOnline = isOnline;

                    RealtimeCollaborationMessage message = RealtimeCollaborationMessage.builder()
                            .type(RealtimeCollaborationMessage.MessageType.PRESENCE_UPDATE)
                            .chapterId(chapterId)
                            .userId(userId)
                            .username(session.username)
                            .displayName(session.displayName)
                            .isOnline(isOnline)
                            .color(session.color)
                            .timestamp(LocalDateTime.now())
                            .build();

                    // Broadcast to other collaborators
                    messagingTemplate.convertAndSend("/topic/chapter/" + chapterId + "/presence", message);
                }
            }
        } catch (Exception e) {
            log.error("Error updating presence for chapter {} user {}", chapterId, userId, e);
        }
    }

    @Override
    public int getActiveCollaboratorCount(UUID chapterId) {
        ConcurrentMap<UUID, UserSession> chapterUsers = activeUsers.get(chapterId);
        return chapterUsers != null ? chapterUsers.size() : 0;
    }

    private String getNextColor(UUID chapterId) {
        ConcurrentMap<UUID, UserSession> chapterUsers = activeUsers.get(chapterId);
        if (chapterUsers == null) {
            return USER_COLORS[0];
        }

        int usedColors = chapterUsers.size();
        return USER_COLORS[usedColors % USER_COLORS.length];
    }

    private String getUserColor(UUID chapterId, UUID userId) {
        ConcurrentMap<UUID, UserSession> chapterUsers = activeUsers.get(chapterId);
        if (chapterUsers != null) {
            UserSession session = chapterUsers.get(userId);
            if (session != null) {
                return session.color;
            }
        }
        return USER_COLORS[0];
    }

    private static class UserSession {
        UUID userId;
        String username;
        String displayName;
        String profileImageUrl;
        String color;
        LocalDateTime lastSeen;
        boolean isOnline;

        UserSession(UUID userId, String username, String displayName, String profileImageUrl, String color) {
            this.userId = userId;
            this.username = username;
            this.displayName = displayName;
            this.profileImageUrl = profileImageUrl;
            this.color = color;
            this.lastSeen = LocalDateTime.now();
            this.isOnline = true;
        }
    }
}