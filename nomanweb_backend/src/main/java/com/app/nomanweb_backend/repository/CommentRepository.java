package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    // Find comments by story (excluding chapter comments)
    Page<Comment> findByStoryIdAndChapterIsNullAndParentCommentIsNullAndModerationStatusOrderByCreatedAtDesc(
            UUID storyId, Comment.ModerationStatus status, Pageable pageable);

    // Find comments by chapter
    Page<Comment> findByChapterIdAndParentCommentIsNullAndModerationStatusOrderByCreatedAtDesc(
            UUID chapterId, Comment.ModerationStatus status, Pageable pageable);

    // Find replies to a comment
    List<Comment> findByParentCommentIdAndModerationStatusOrderByCreatedAtAsc(
            UUID parentCommentId, Comment.ModerationStatus status);

    // Find comments by user
    Page<Comment> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    // Find comments by moderation status
    Page<Comment> findByModerationStatusOrderByCreatedAtDesc(Comment.ModerationStatus status, Pageable pageable);

    // Count comments by story (excluding chapter comments)
    long countByStoryIdAndChapterIsNullAndModerationStatus(UUID storyId, Comment.ModerationStatus status);

    // Count comments by chapter
    long countByChapterIdAndModerationStatus(UUID chapterId, Comment.ModerationStatus status);

    // Count replies to a comment
    long countByParentCommentIdAndModerationStatus(UUID parentCommentId, Comment.ModerationStatus status);

    // Find pinned comments for story (excluding chapter comments)
    List<Comment> findByStoryIdAndChapterIsNullAndIsPinnedTrueAndModerationStatusOrderByCreatedAtDesc(
            UUID storyId, Comment.ModerationStatus status);

    // Find pinned comments for chapter
    List<Comment> findByChapterIdAndIsPinnedTrueAndModerationStatusOrderByCreatedAtDesc(
            UUID chapterId, Comment.ModerationStatus status);

    // Find latest comments across all content
    @Query("SELECT c FROM Comment c WHERE c.moderationStatus = :status AND c.parentComment IS NULL ORDER BY c.createdAt DESC")
    Page<Comment> findLatestComments(@Param("status") Comment.ModerationStatus status, Pageable pageable);

    // Find comments needing moderation
    Page<Comment> findByModerationStatusOrderByCreatedAtAsc(Comment.ModerationStatus status, Pageable pageable);

    // Get comment statistics
    @Query("SELECT COUNT(c) FROM Comment c WHERE c.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.story.id = :storyId")
    long countByStoryId(@Param("storyId") UUID storyId);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.chapter.id = :chapterId")
    long countByChapterId(@Param("chapterId") UUID chapterId);
}