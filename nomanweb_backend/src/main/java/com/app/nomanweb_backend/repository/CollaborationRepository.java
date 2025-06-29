package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.Collaboration;
import com.app.nomanweb_backend.entity.Collaboration.CollaborationRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CollaborationRepository extends JpaRepository<Collaboration, UUID> {

    // Find collaboration by chapter and user
    Optional<Collaboration> findByChapterIdAndUserId(UUID chapterId, UUID userId);

    // Find all collaborations for a chapter
    List<Collaboration> findByChapterIdAndActiveTrue(UUID chapterId);

    // Find all collaborations for a user
    List<Collaboration> findByUserIdAndActiveTrue(UUID userId);

    // Find collaboration by invitation token
    Optional<Collaboration> findByInvitationToken(String invitationToken);

    // Check if user has specific role for chapter
    @Query("SELECT c FROM Collaboration c WHERE c.chapter.id = :chapterId AND c.user.id = :userId AND c.role = :role AND c.active = true")
    Optional<Collaboration> findByChapterIdAndUserIdAndRole(@Param("chapterId") UUID chapterId,
            @Param("userId") UUID userId,
            @Param("role") CollaborationRole role);

    // Count active collaborators for a chapter
    @Query("SELECT COUNT(c) FROM Collaboration c WHERE c.chapter.id = :chapterId AND c.active = true")
    long countActiveCollaboratorsByChapterId(@Param("chapterId") UUID chapterId);

    // Find all collaborations for a story (through chapters)
    @Query("SELECT c FROM Collaboration c WHERE c.chapter.story.id = :storyId AND c.user.id = :userId AND c.active = true")
    List<Collaboration> findByStoryIdAndUserId(@Param("storyId") UUID storyId, @Param("userId") UUID userId);

    // Check if user can access chapter (either owner or collaborator)
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Collaboration c " +
            "WHERE c.chapter.id = :chapterId AND c.user.id = :userId AND c.active = true")
    boolean hasAccessToChapter(@Param("chapterId") UUID chapterId, @Param("userId") UUID userId);

    // Get all pending invitations for a user
    @Query("SELECT c FROM Collaboration c WHERE c.user.id = :userId AND c.invitationAcceptedAt IS NULL AND c.invitationExpiresAt > CURRENT_TIMESTAMP")
    List<Collaboration> findPendingInvitationsByUserId(@Param("userId") UUID userId);
}