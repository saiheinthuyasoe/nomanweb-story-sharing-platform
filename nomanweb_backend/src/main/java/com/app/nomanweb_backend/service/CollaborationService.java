package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.collaboration.*;
import com.app.nomanweb_backend.entity.Collaboration.CollaborationRole;

import java.util.List;
import java.util.UUID;

public interface CollaborationService {

    // Create and send collaboration invitation
    CollaborationResponse createInvitation(CreateCollaborationRequest request, UUID inviterId);

    // Accept collaboration invitation
    CollaborationResponse acceptInvitation(String invitationToken, UUID userId);

    // Update collaborator role
    CollaborationResponse updateCollaboratorRole(UUID chapterId, UUID userId, CollaborationRole newRole,
            UUID requesterId);

    // Remove collaborator
    void removeCollaborator(UUID chapterId, UUID userId, UUID requesterId);

    // Get all collaborators for a chapter
    List<CollaborationResponse> getChapterCollaborators(UUID chapterId, UUID requesterId);

    // Get all collaborations for a user
    List<CollaborationResponse> getUserCollaborations(UUID userId);

    // Get pending invitations for a user
    List<CollaborationResponse> getPendingInvitations(UUID userId);

    // Check if user has access to chapter
    boolean hasAccessToChapter(UUID chapterId, UUID userId);

    // Check if user has edit permission
    boolean hasEditPermission(UUID chapterId, UUID userId);

    // Get collaboration by invitation token
    CollaborationResponse getByInvitationToken(String token);

    // Update collaborator presence
    void updatePresence(UUID chapterId, UUID userId, CollaboratorPresence presence);

    // Get online collaborators for a chapter
    List<CollaboratorPresence> getOnlineCollaborators(UUID chapterId);

    // Leave collaboration (self-remove)
    void leaveCollaboration(UUID chapterId, UUID userId);
}