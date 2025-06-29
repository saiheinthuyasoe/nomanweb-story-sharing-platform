package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.collaboration.*;
import com.app.nomanweb_backend.entity.*;
import com.app.nomanweb_backend.entity.Collaboration.CollaborationRole;
import com.app.nomanweb_backend.repository.*;
import com.app.nomanweb_backend.service.CollaborationService;
import com.app.nomanweb_backend.service.EmailService;
import com.app.nomanweb_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CollaborationServiceImpl implements CollaborationService {

    private final CollaborationRepository collaborationRepository;
    private final ChapterRepository chapterRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    // In-memory storage for real-time presence (in production, use Redis)
    private final Map<UUID, Map<UUID, CollaboratorPresence>> chapterPresenceMap = new ConcurrentHashMap<>();

    @Override
    public CollaborationResponse createInvitation(CreateCollaborationRequest request, UUID inviterId) {
        log.info("Creating collaboration invitation for chapter: {} by user: {}", request.getChapterId(), inviterId);

        // Get chapter and verify ownership
        Chapter chapter = chapterRepository.findById(request.getChapterId())
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        if (!chapter.getStory().getAuthor().getId().equals(inviterId)) {
            // Check if inviter has EDIT permission
            boolean hasEditPermission = collaborationRepository
                    .findByChapterIdAndUserIdAndRole(request.getChapterId(), inviterId, CollaborationRole.EDIT)
                    .map(c -> c.getActive())
                    .orElse(false);

            if (!hasEditPermission) {
                throw new IllegalArgumentException("Only the author or editors can invite collaborators");
            }
        }

        // Find invitee user by email
        User invitee = userRepository.findByEmail(request.getInviteeEmail())
                .orElseThrow(() -> new IllegalArgumentException("User with email not found"));

        // Check if collaboration already exists
        Optional<Collaboration> existing = collaborationRepository
                .findByChapterIdAndUserId(chapter.getId(), invitee.getId());

        if (existing.isPresent() && existing.get().getActive()) {
            throw new IllegalArgumentException("User is already a collaborator");
        }

        // Create or update collaboration
        Collaboration collaboration = existing.orElseGet(Collaboration::new);
        collaboration.setChapter(chapter);
        collaboration.setUser(invitee);
        collaboration.setRole(CollaborationRole.valueOf(request.getRole()));
        collaboration.setActive(false); // Not active until accepted
        collaboration.setInvitationToken(generateInvitationToken());
        collaboration.setInvitationExpiresAt(LocalDateTime.now().plusDays(7));
        collaboration.setInvitedBy(userRepository.findById(inviterId).orElse(null));

        collaboration = collaborationRepository.save(collaboration);

        // Send invitation email
        sendInvitationEmail(collaboration, request.getMessage());

        // Create notification
        notificationService.createNotification(
                invitee.getId(),
                Notification.NotificationType.SYSTEM,
                String.format("Collaboration invitation from %s",
                        collaboration.getInvitedBy() != null ? collaboration.getInvitedBy().getDisplayName()
                                : "a user"),
                String.format("You've been invited to collaborate on \"%s\" as %s", chapter.getTitle(),
                        request.getRole()),
                Notification.RelatedType.CHAPTER,
                chapter.getId());

        return mapToResponse(collaboration);
    }

    @Override
    public CollaborationResponse acceptInvitation(String invitationToken, UUID userId) {
        log.info("Accepting invitation with token: {} for user: {}", invitationToken, userId);

        Collaboration collaboration = collaborationRepository.findByInvitationToken(invitationToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        // Verify the invitation is for this user
        if (!collaboration.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("This invitation is not for you");
        }

        // Check if invitation has expired
        if (collaboration.getInvitationExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Invitation has expired");
        }

        // Accept the invitation
        collaboration.setActive(true);
        collaboration.setInvitationAcceptedAt(LocalDateTime.now());
        collaboration = collaborationRepository.save(collaboration);

        // Notify the inviter
        if (collaboration.getInvitedBy() != null) {
            notificationService.createNotification(
                    collaboration.getInvitedBy().getId(),
                    Notification.NotificationType.SYSTEM,
                    "Collaboration invitation accepted",
                    String.format("%s accepted your collaboration invitation for \"%s\"",
                            collaboration.getUser().getDisplayName(),
                            collaboration.getChapter().getTitle()),
                    Notification.RelatedType.CHAPTER,
                    collaboration.getChapter().getId());
        }

        return mapToResponse(collaboration);
    }

    @Override
    public CollaborationResponse updateCollaboratorRole(UUID chapterId, UUID userId, CollaborationRole newRole,
            UUID requesterId) {
        log.info("Updating collaborator role for user: {} on chapter: {}", userId, chapterId);

        // Verify requester has permission
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        if (!chapter.getStory().getAuthor().getId().equals(requesterId)) {
            throw new IllegalArgumentException("Only the author can change collaborator roles");
        }

        Collaboration collaboration = collaborationRepository.findByChapterIdAndUserId(chapterId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Collaboration not found"));

        collaboration.setRole(newRole);
        collaboration = collaborationRepository.save(collaboration);

        // Notify the collaborator
        notificationService.createNotification(
                userId,
                Notification.NotificationType.SYSTEM,
                "Role updated",
                String.format("Your role has been changed to %s for \"%s\"", newRole, chapter.getTitle()),
                Notification.RelatedType.CHAPTER,
                chapterId);

        return mapToResponse(collaboration);
    }

    @Override
    public void removeCollaborator(UUID chapterId, UUID userId, UUID requesterId) {
        log.info("Removing collaborator {} from chapter: {} by: {}", userId, chapterId, requesterId);

        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        if (!chapter.getStory().getAuthor().getId().equals(requesterId)) {
            throw new IllegalArgumentException("Only the author can remove collaborators");
        }

        Collaboration collaboration = collaborationRepository.findByChapterIdAndUserId(chapterId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Collaboration not found"));

        collaboration.setActive(false);
        collaborationRepository.save(collaboration);

        // Remove from presence map
        Map<UUID, CollaboratorPresence> chapterPresence = chapterPresenceMap.get(chapterId);
        if (chapterPresence != null) {
            chapterPresence.remove(userId);
        }

        // Notify the removed collaborator
        notificationService.createNotification(
                userId,
                Notification.NotificationType.SYSTEM,
                "Removed from collaboration",
                String.format("You've been removed from \"%s\"", chapter.getTitle()),
                Notification.RelatedType.CHAPTER,
                chapterId);
    }

    @Override
    public List<CollaborationResponse> getChapterCollaborators(UUID chapterId, UUID requesterId) {
        // Verify requester has access
        if (!hasAccessToChapter(chapterId, requesterId)) {
            Chapter chapter = chapterRepository.findById(chapterId).orElse(null);
            if (chapter == null || !chapter.getStory().getAuthor().getId().equals(requesterId)) {
                throw new IllegalArgumentException("Access denied");
            }
        }

        return collaborationRepository.findByChapterIdAndActiveTrue(chapterId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CollaborationResponse> getUserCollaborations(UUID userId) {
        return collaborationRepository.findByUserIdAndActiveTrue(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CollaborationResponse> getPendingInvitations(UUID userId) {
        return collaborationRepository.findPendingInvitationsByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public boolean hasAccessToChapter(UUID chapterId, UUID userId) {
        Chapter chapter = chapterRepository.findById(chapterId).orElse(null);
        if (chapter == null)
            return false;

        // Check if user is the author
        if (chapter.getStory().getAuthor().getId().equals(userId)) {
            return true;
        }

        // Check if user is a collaborator
        return collaborationRepository.hasAccessToChapter(chapterId, userId);
    }

    @Override
    public boolean hasEditPermission(UUID chapterId, UUID userId) {
        Chapter chapter = chapterRepository.findById(chapterId).orElse(null);
        if (chapter == null)
            return false;

        // Check if user is the author
        if (chapter.getStory().getAuthor().getId().equals(userId)) {
            return true;
        }

        // Check if user has EDIT role
        return collaborationRepository
                .findByChapterIdAndUserIdAndRole(chapterId, userId, CollaborationRole.EDIT)
                .map(Collaboration::getActive)
                .orElse(false);
    }

    @Override
    public CollaborationResponse getByInvitationToken(String token) {
        return collaborationRepository.findByInvitationToken(token)
                .map(this::mapToResponse)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));
    }

    @Override
    public void updatePresence(UUID chapterId, UUID userId, CollaboratorPresence presence) {
        // Verify user has access
        if (!hasAccessToChapter(chapterId, userId)) {
            throw new IllegalArgumentException("Access denied");
        }

        chapterPresenceMap
                .computeIfAbsent(chapterId, k -> new ConcurrentHashMap<>())
                .put(userId, presence);
    }

    @Override
    public List<CollaboratorPresence> getOnlineCollaborators(UUID chapterId) {
        Map<UUID, CollaboratorPresence> chapterPresence = chapterPresenceMap.get(chapterId);
        if (chapterPresence == null) {
            return new ArrayList<>();
        }

        // Filter out offline users (last seen more than 1 minute ago)
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(1);
        return chapterPresence.values().stream()
                .filter(p -> p.getLastSeenAt() != null && p.getLastSeenAt().isAfter(cutoff))
                .collect(Collectors.toList());
    }

    @Override
    public void leaveCollaboration(UUID chapterId, UUID userId) {
        log.info("User {} leaving collaboration on chapter: {}", userId, chapterId);

        Collaboration collaboration = collaborationRepository.findByChapterIdAndUserId(chapterId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Collaboration not found"));

        collaboration.setActive(false);
        collaborationRepository.save(collaboration);

        // Remove from presence map
        Map<UUID, CollaboratorPresence> chapterPresence = chapterPresenceMap.get(chapterId);
        if (chapterPresence != null) {
            chapterPresence.remove(userId);
        }
    }

    private CollaborationResponse mapToResponse(Collaboration collaboration) {
        Chapter chapter = collaboration.getChapter();
        Story story = chapter.getStory();

        return CollaborationResponse.builder()
                .id(collaboration.getId())
                .chapterId(chapter.getId())
                .chapterTitle(chapter.getTitle())
                .chapterNumber(chapter.getChapterNumber())
                .storyId(story.getId())
                .storyTitle(story.getTitle())
                .user(mapUserToInfo(collaboration.getUser()))
                .role(collaboration.getRole().toString())
                .active(collaboration.getActive())
                .createdAt(collaboration.getCreatedAt())
                .updatedAt(collaboration.getUpdatedAt())
                .invitationToken(collaboration.getInvitationToken())
                .invitationExpiresAt(collaboration.getInvitationExpiresAt())
                .invitationAcceptedAt(collaboration.getInvitationAcceptedAt())
                .invitedBy(collaboration.getInvitedBy() != null ? mapUserToInfo(collaboration.getInvitedBy()) : null)
                .isPending(collaboration.getInvitationAcceptedAt() == null)
                .build();
    }

    private CollaborationResponse.UserInfo mapUserToInfo(User user) {
        return CollaborationResponse.UserInfo.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }

    private String generateInvitationToken() {
        return UUID.randomUUID().toString().replace("-", "") +
                UUID.randomUUID().toString().replace("-", "");
    }

    private void sendInvitationEmail(Collaboration collaboration, String customMessage) {
        try {
            User invitee = collaboration.getUser();
            User inviter = collaboration.getInvitedBy();
            Chapter chapter = collaboration.getChapter();

            String invitationUrl = String.format("%s/collaborate/accept?token=%s",
                    frontendUrl, collaboration.getInvitationToken());

            log.info("Preparing to send collaboration invitation email:");
            log.info("  - To: {}", invitee.getEmail());
            log.info("  - From: {}", inviter != null ? inviter.getDisplayName() : "Unknown");
            log.info("  - Chapter: {}", chapter.getTitle());
            log.info("  - Story: {}", chapter.getStory().getTitle());
            log.info("  - Role: {}", collaboration.getRole());
            log.info("  - Invitation URL: {}", invitationUrl);
            log.info("  - Frontend URL: {}", frontendUrl);

            // Send the invitation email using EmailService
            emailService.sendCollaborationInvitationEmail(
                    invitee,
                    inviter,
                    chapter.getTitle(),
                    chapter.getStory().getTitle(),
                    collaboration.getRole().toString(),
                    invitationUrl,
                    customMessage);

            log.info("Collaboration invitation email sent successfully to: {}", invitee.getEmail());
        } catch (Exception e) {
            log.error("Failed to send collaboration invitation email for collaboration: {}", collaboration.getId(), e);
            // Don't throw the exception to prevent the invitation creation from failing
            // The invitation is still created and the notification is sent
        }
    }
}