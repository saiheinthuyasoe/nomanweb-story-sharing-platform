package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.collaboration.RealtimeCollaborationMessage;
import com.app.nomanweb_backend.service.RealtimeCollaborationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RestController;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Slf4j
public class RealtimeCollaborationController {

    private final RealtimeCollaborationService realtimeCollaborationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @MessageMapping("/chapter/{chapterId}/join")
    @SendToUser("/queue/joined")
    public void joinChapter(@Payload String payload, SimpMessageHeaderAccessor headerAccessor, Principal principal) {
        try {
            // Parse the JSON payload
            JsonNode jsonNode = objectMapper.readTree(payload);
            String chapterId = jsonNode.get("chapterId").asText();
            UUID chapterUUID = UUID.fromString(chapterId);
            String userId = principal.getName();

            // Extract user info from JSON payload
            String username = jsonNode.has("username") ? jsonNode.get("username").asText() : null;
            String displayName = jsonNode.has("displayName") ? jsonNode.get("displayName").asText() : null;
            String profileImageUrl = jsonNode.has("profileImageUrl") ? jsonNode.get("profileImageUrl").asText() : null;

            if (username == null || username.isEmpty() || displayName == null || displayName.isEmpty()) {
                log.warn("Missing user info in join request for chapter {} - userId: {}, username: {}, displayName: {}",
                        chapterId, userId, username, displayName);
                // Use userId as fallback
                username = userId;
                displayName = userId;
            }

            realtimeCollaborationService.notifyUserJoined(
                    chapterUUID,
                    UUID.fromString(userId),
                    username,
                    displayName,
                    profileImageUrl);

            log.info("User {} joined chapter {} collaboration", username, chapterId);
        } catch (Exception e) {
            log.error("Error processing join request", e);
        }
    }

    @MessageMapping("/chapter/{chapterId}/leave")
    public void leaveChapter(@Payload String chapterId, Principal principal) {
        try {
            UUID chapterUUID = UUID.fromString(chapterId);
            String userId = principal.getName();

            realtimeCollaborationService.notifyUserLeft(chapterUUID, UUID.fromString(userId));

            log.info("User {} left chapter {} collaboration", userId, chapterId);
        } catch (Exception e) {
            log.error("Error processing leave request for chapter {}", chapterId, e);
        }
    }

    @MessageMapping("/chapter/{chapterId}/content")
    public void handleContentUpdate(@Payload RealtimeCollaborationMessage message, Principal principal) {
        try {
            String userId = principal.getName();
            log.info("Received content update message: chapterId={}, userId={}, messageUserId={}, contentLength={}",
                    message.getChapterId(), userId, message.getUserId(),
                    message.getContent() != null ? message.getContent().length() : 0);

            // Verify the message is from the authenticated user
            if (!message.getUserId().toString().equals(userId)) {
                log.warn("User {} attempted to send content update for user {}", userId, message.getUserId());
                return;
            }

            log.info("Processing content update for chapter {} from user {}", message.getChapterId(), userId);
            realtimeCollaborationService.broadcastContentUpdate(
                    message.getChapterId(),
                    message.getUserId(),
                    message.getContent(),
                    message.getPosition(),
                    message.getLength(),
                    message.getOperation());

            log.info("Successfully processed content update from user {} for chapter {}", userId,
                    message.getChapterId());
        } catch (Exception e) {
            log.error("Error processing content update for chapter {}", message.getChapterId(), e);
        }
    }

    @MessageMapping("/chapter/{chapterId}/cursor")
    public void handleCursorPosition(@Payload RealtimeCollaborationMessage message, Principal principal) {
        try {
            String userId = principal.getName();

            // Verify the message is from the authenticated user
            if (!message.getUserId().toString().equals(userId)) {
                log.warn("User {} attempted to send cursor position for user {}", userId, message.getUserId());
                return;
            }

            realtimeCollaborationService.broadcastCursorPosition(
                    message.getChapterId(),
                    message.getUserId(),
                    message.getCursorPosition());

            log.debug("Processed cursor position from user {} for chapter {}", userId, message.getChapterId());
        } catch (Exception e) {
            log.error("Error processing cursor position for chapter {}", message.getChapterId(), e);
        }
    }

    @MessageMapping("/chapter/{chapterId}/selection")
    public void handleSelectionRange(@Payload RealtimeCollaborationMessage message, Principal principal) {
        try {
            String userId = principal.getName();

            // Verify the message is from the authenticated user
            if (!message.getUserId().toString().equals(userId)) {
                log.warn("User {} attempted to send selection range for user {}", userId, message.getUserId());
                return;
            }

            realtimeCollaborationService.broadcastSelectionRange(
                    message.getChapterId(),
                    message.getUserId(),
                    message.getSelectionStart(),
                    message.getSelectionEnd());

            log.debug("Processed selection range from user {} for chapter {}", userId, message.getChapterId());
        } catch (Exception e) {
            log.error("Error processing selection range for chapter {}", message.getChapterId(), e);
        }
    }

    @MessageMapping("/chapter/{chapterId}/presence")
    public void handlePresenceUpdate(@Payload RealtimeCollaborationMessage message, Principal principal) {
        try {
            String userId = principal.getName();

            // Verify the message is from the authenticated user
            if (!message.getUserId().toString().equals(userId)) {
                log.warn("User {} attempted to send presence update for user {}", userId, message.getUserId());
                return;
            }

            realtimeCollaborationService.updatePresence(
                    message.getChapterId(),
                    message.getUserId(),
                    message.isOnline());

            log.debug("Processed presence update from user {} for chapter {}", userId, message.getChapterId());
        } catch (Exception e) {
            log.error("Error processing presence update for chapter {}", message.getChapterId(), e);
        }
    }

    @GetMapping("/api/websocket/health")
    public String healthCheck() {
        log.info("WebSocket health check endpoint called");
        return "WebSocket service is running";
    }
}