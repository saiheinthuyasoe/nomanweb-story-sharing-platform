package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.collaboration.*;
import com.app.nomanweb_backend.entity.Collaboration.CollaborationRole;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.service.CollaborationService;
import com.app.nomanweb_backend.service.EmailService;
import com.app.nomanweb_backend.service.NotificationService;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/collaborations")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://127.0.0.1:3000" })
@Slf4j
public class CollaborationController {

    private final CollaborationService collaborationService;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    // Create collaboration invitation
    @PostMapping("/invite")
    public ResponseEntity<CollaborationResponse> createInvitation(
            @Valid @RequestBody CreateCollaborationRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId(httpRequest);
            CollaborationResponse response = collaborationService.createInvitation(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.error("Error creating invitation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error creating invitation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Accept collaboration invitation
    @PostMapping("/accept/{token}")
    public ResponseEntity<CollaborationResponse> acceptInvitation(
            @PathVariable String token,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId(httpRequest);
            CollaborationResponse response = collaborationService.acceptInvitation(token, userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Error accepting invitation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error accepting invitation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get invitation details by token (for preview)
    @GetMapping("/invitation/{token}")
    public ResponseEntity<CollaborationResponse> getInvitationDetails(@PathVariable String token) {
        try {
            CollaborationResponse response = collaborationService.getByInvitationToken(token);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Error getting invitation details: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error getting invitation details", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Test email endpoint (for debugging)
    @PostMapping("/test-email")
    public ResponseEntity<Map<String, String>> testEmail(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }

            // Create a test collaboration invitation email
            User testUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            // Send test email
            emailService.sendCollaborationInvitationEmail(
                    testUser,
                    testUser, // Use same user as inviter for test
                    "Test Chapter",
                    "Test Story",
                    "EDIT",
                    "http://localhost:3000/collaborate/accept?token=test-token",
                    "This is a test invitation");

            return ResponseEntity.ok(Map.of("message", "Test email sent successfully"));
        } catch (Exception e) {
            log.error("Error sending test email", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send test email: " + e.getMessage()));
        }
    }

    // Test notification endpoint (for debugging)
    @PostMapping("/test-notification")
    public ResponseEntity<Map<String, String>> testNotification(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }

            User testUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            // Create a test notification
            notificationService.createNotification(
                    testUser.getId(),
                    com.app.nomanweb_backend.entity.Notification.NotificationType.SYSTEM,
                    "Test Collaboration Invitation",
                    "This is a test collaboration invitation notification",
                    com.app.nomanweb_backend.entity.Notification.RelatedType.CHAPTER,
                    UUID.randomUUID());

            return ResponseEntity.ok(Map.of("message", "Test notification created successfully"));
        } catch (Exception e) {
            log.error("Error creating test notification", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create test notification: " + e.getMessage()));
        }
    }

    // Update collaborator role
    @PutMapping("/chapters/{chapterId}/users/{userId}/role")
    public ResponseEntity<CollaborationResponse> updateRole(
            @PathVariable UUID chapterId,
            @PathVariable UUID userId,
            @RequestParam String role,
            HttpServletRequest httpRequest) {
        try {
            UUID requesterId = getCurrentUserId(httpRequest);
            CollaborationRole newRole = CollaborationRole.valueOf(role.toUpperCase());
            CollaborationResponse response = collaborationService.updateCollaboratorRole(
                    chapterId, userId, newRole, requesterId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Error updating role: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error updating role", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Remove collaborator
    @DeleteMapping("/chapters/{chapterId}/users/{userId}")
    public ResponseEntity<Void> removeCollaborator(
            @PathVariable UUID chapterId,
            @PathVariable UUID userId,
            HttpServletRequest httpRequest) {
        try {
            UUID requesterId = getCurrentUserId(httpRequest);
            collaborationService.removeCollaborator(chapterId, userId, requesterId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.error("Error removing collaborator: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error removing collaborator", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Leave collaboration (self-remove)
    @DeleteMapping("/chapters/{chapterId}/leave")
    public ResponseEntity<Void> leaveCollaboration(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId(httpRequest);
            collaborationService.leaveCollaboration(chapterId, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.error("Error leaving collaboration: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error leaving collaboration", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get chapter collaborators
    @GetMapping("/chapters/{chapterId}")
    public ResponseEntity<List<CollaborationResponse>> getChapterCollaborators(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId(httpRequest);
            List<CollaborationResponse> collaborators = collaborationService
                    .getChapterCollaborators(chapterId, userId);
            return ResponseEntity.ok(collaborators);
        } catch (IllegalArgumentException e) {
            log.error("Error getting collaborators: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error getting collaborators", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get user's collaborations
    @GetMapping("/my-collaborations")
    public ResponseEntity<List<CollaborationResponse>> getUserCollaborations(
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId(httpRequest);
            List<CollaborationResponse> collaborations = collaborationService
                    .getUserCollaborations(userId);
            return ResponseEntity.ok(collaborations);
        } catch (Exception e) {
            log.error("Unexpected error getting user collaborations", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get pending invitations
    @GetMapping("/pending-invitations")
    public ResponseEntity<List<CollaborationResponse>> getPendingInvitations(
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId(httpRequest);
            List<CollaborationResponse> invitations = collaborationService
                    .getPendingInvitations(userId);
            return ResponseEntity.ok(invitations);
        } catch (Exception e) {
            log.error("Unexpected error getting pending invitations", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Update presence (for real-time collaboration)
    @PostMapping("/chapters/{chapterId}/presence")
    public ResponseEntity<Void> updatePresence(
            @PathVariable UUID chapterId,
            @RequestBody CollaboratorPresence presence,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId(httpRequest);
            presence.setUserId(userId); // Ensure userId matches authenticated user
            collaborationService.updatePresence(chapterId, userId, presence);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Error updating presence: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error updating presence", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get online collaborators
    @GetMapping("/chapters/{chapterId}/online")
    public ResponseEntity<List<CollaboratorPresence>> getOnlineCollaborators(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getCurrentUserId(httpRequest);
            // Verify access before returning online users
            if (!collaborationService.hasAccessToChapter(chapterId, userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            List<CollaboratorPresence> onlineUsers = collaborationService
                    .getOnlineCollaborators(chapterId);
            return ResponseEntity.ok(onlineUsers);
        } catch (Exception e) {
            log.error("Unexpected error getting online collaborators", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private UUID getCurrentUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.getUserIdFromToken(token);
        }
        throw new IllegalArgumentException("No valid authentication token found");
    }
}