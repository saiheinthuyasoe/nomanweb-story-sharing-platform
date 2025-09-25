package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.RefreshToken;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.RefreshTokenRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.service.EnhancedNotificationService;
import com.app.nomanweb_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
@Slf4j
public class TestController {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final EnhancedNotificationService enhancedNotificationService;
    private final UserService userService;

    @GetMapping("/auth")
    public ResponseEntity<Map<String, Object>> testAuth() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getPrincipal().equals("anonymousUser")) {

            return ResponseEntity.ok(Map.of(
                    "message", "Authentication successful",
                    "userId", authentication.getName(),
                    "authorities", authentication.getAuthorities(),
                    "timestamp", LocalDateTime.now()));
        } else {
            return ResponseEntity.status(401).body(Map.of(
                    "message", "Not authenticated",
                    "timestamp", LocalDateTime.now()));
        }
    }

    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> testPublic() {
        return ResponseEntity.ok(Map.of(
                "message", "This is a public endpoint",
                "timestamp", LocalDateTime.now()));
    }

    @GetMapping("/tokens")
    public ResponseEntity<Map<String, Object>> checkTokens() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() ||
                authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        try {
            UUID userId = UUID.fromString(authentication.getName());
            User user = userRepository.findById(userId).orElse(null);

            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            List<RefreshToken> tokens = refreshTokenRepository.findByUser(user);
            List<Map<String, Object>> tokenInfo = tokens.stream()
                    .map(token -> Map.<String, Object>of(
                            "id", token.getId(),
                            "token",
                            token.getToken().substring(0, 20) + "..."
                                    + token.getToken().substring(token.getToken().length() - 10),
                            "expiresAt", token.getExpiresAt(),
                            "revoked", token.isRevoked(),
                            "revokedAt", token.getRevokedAt(),
                            "isValid", token.isValid()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "userEmail", user.getEmail(),
                    "activeTokenCount", refreshTokenRepository.countActiveTokensByUser(user),
                    "totalTokenCount", tokens.size(),
                    "tokens", tokenInfo,
                    "timestamp", LocalDateTime.now()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/line-notification-with-image")
    public ResponseEntity<Map<String, Object>> testLineNotificationWithImage(
            @RequestBody Map<String, String> request) {
        try {
            UUID userId = getCurrentUserId();
            User user = userService.getUserById(userId);

            String title = request.getOrDefault("title", "Test Story Notification");
            String message = request.getOrDefault("message", "A new story with cover image has been published!");
            String coverImageUrl = request.getOrDefault("coverImageUrl",
                    "https://res.cloudinary.com/dou5xwcdi/image/upload/v1726825234/story_covers/default_cover.jpg");
            String actionUrl = request.getOrDefault("actionUrl", "https://nomanweb.com/stories/test");

            log.info("Testing LINE notification with image for user: {}", userId);
            log.info("Cover image URL: {}", coverImageUrl);
            log.info("Action URL: {}", actionUrl);

            String result = enhancedNotificationService.sendLineNotificationWithImage(
                    user,
                    com.app.nomanweb_backend.entity.Notification.NotificationType.NEW_STORY,
                    title,
                    message,
                    coverImageUrl,
                    actionUrl);

            Map<String, Object> response = new HashMap<>();
            response.put("success", result != null);
            response.put("message",
                    result != null ? "LINE notification sent successfully" : "Failed to send LINE notification");
            response.put("lineMessageId", result);
            response.put("userId", userId);
            response.put("userLineId", user.getLineUserId());
            response.put("lineNotificationsEnabled", user.getLineNotificationsEnabled());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error testing LINE notification with image", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/user-line-status")
    public ResponseEntity<Map<String, Object>> getUserLineStatus() {
        try {
            UUID userId = getCurrentUserId();
            User user = userService.getUserById(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("userId", userId);
            response.put("lineUserId", user.getLineUserId());
            response.put("lineNotificationsEnabled", user.getLineNotificationsEnabled());
            response.put("canReceiveLineNotifications",
                    user.getLineUserId() != null && user.getLineNotificationsEnabled());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting user LINE status", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return UUID.fromString(authentication.getName());
    }
}