package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface CommentService {

    // Basic comment operations
    Comment createComment(UUID userId, UUID storyId, UUID chapterId, String content);

    Comment createReply(UUID userId, UUID parentCommentId, String content);

    Comment updateComment(UUID commentId, String content, UUID userId);

    void deleteComment(UUID commentId, UUID userId);

    Comment getCommentById(UUID commentId);

    // Comment listing
    Page<Comment> getStoryComments(UUID storyId, Pageable pageable);

    Page<Comment> getChapterComments(UUID chapterId, Pageable pageable);

    List<Comment> getCommentReplies(UUID parentCommentId);

    Page<Comment> getUserComments(UUID userId, Pageable pageable);

    // Comment statistics
    long getStoryCommentCount(UUID storyId);

    long getChapterCommentCount(UUID chapterId);

    long getUserCommentCount(UUID userId);

    // Comment moderation
    Comment approveComment(UUID commentId, UUID moderatorId);

    Comment rejectComment(UUID commentId, UUID moderatorId, String reason);

    Comment flagComment(UUID commentId, UUID userId, String reason);

    Page<Comment> getPendingComments(Pageable pageable);

    // Comment features
    Comment pinComment(UUID commentId, UUID userId);

    Comment unpinComment(UUID commentId, UUID userId);

    void likeComment(UUID commentId, UUID userId);

    void unlikeComment(UUID commentId, UUID userId);

    boolean hasUserLikedComment(UUID commentId, UUID userId);

    // Special queries
    List<Comment> getPinnedComments(UUID storyId, UUID chapterId);

    Page<Comment> getLatestComments(Pageable pageable);

    // Validation and authorization
    boolean canUserEditComment(UUID commentId, UUID userId);

    boolean canUserDeleteComment(UUID commentId, UUID userId);

    boolean canUserModerateComment(UUID commentId, UUID userId);

    // Statistics and analytics
    Map<String, Object> getCommentStats(UUID userId);

    Map<String, Object> getContentCommentStats(UUID storyId, UUID chapterId);
}