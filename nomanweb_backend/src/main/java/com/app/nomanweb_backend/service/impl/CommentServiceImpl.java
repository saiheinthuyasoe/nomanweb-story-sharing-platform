package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.entity.*;
import com.app.nomanweb_backend.repository.*;
import com.app.nomanweb_backend.service.CommentService;
import com.app.nomanweb_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final ReactionRepository reactionRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public Comment createComment(UUID userId, UUID storyId, UUID chapterId, String content) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Comment.CommentBuilder commentBuilder = Comment.builder()
                .user(user)
                .content(content)
                .moderationStatus(Comment.ModerationStatus.APPROVED); // Auto-approve for now

        // Determine if this is a story or chapter comment
        if (chapterId != null) {
            Chapter chapter = chapterRepository.findById(chapterId)
                    .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));
            commentBuilder.chapter(chapter).story(chapter.getStory());

            // Notify chapter author
            if (!chapter.getStory().getAuthor().getId().equals(userId)) {
                notificationService.notifyNewComment(
                        chapter.getStory().getAuthor().getId(), userId,
                        chapter.getStory().getId(), chapterId, null);
            }
        } else if (storyId != null) {
            Story story = storyRepository.findById(storyId)
                    .orElseThrow(() -> new IllegalArgumentException("Story not found"));
            commentBuilder.story(story);

            // Notify story author
            if (!story.getAuthor().getId().equals(userId)) {
                notificationService.notifyNewComment(
                        story.getAuthor().getId(), userId,
                        storyId, null, null);
            }
        } else {
            throw new IllegalArgumentException("Either storyId or chapterId must be provided");
        }

        Comment comment = commentRepository.save(commentBuilder.build());
        log.info("Created comment {} by user {} on {}",
                comment.getId(), userId, chapterId != null ? "chapter " + chapterId : "story " + storyId);
        return comment;
    }

    @Override
    @Transactional
    public Comment createReply(UUID userId, UUID parentCommentId, String content) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Comment parentComment = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));

        Comment reply = Comment.builder()
                .user(user)
                .content(content)
                .parentComment(parentComment)
                .story(parentComment.getStory())
                .chapter(parentComment.getChapter())
                .moderationStatus(Comment.ModerationStatus.APPROVED) // Auto-approve for now
                .build();

        reply = commentRepository.save(reply);

        // Notify parent comment author
        if (!parentComment.getUser().getId().equals(userId)) {
            notificationService.notifyCommentReply(
                    parentComment.getUser().getId(), userId, reply.getId());
        }

        log.info("Created reply {} by user {} to comment {}",
                reply.getId(), userId, parentCommentId);
        return reply;
    }

    @Override
    @Transactional
    public Comment updateComment(UUID commentId, String content, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!canUserEditComment(commentId, userId)) {
            throw new IllegalArgumentException("User not authorized to edit this comment");
        }

        comment.setContent(content);
        comment.setModerationStatus(Comment.ModerationStatus.APPROVED); // Re-approve after edit
        comment = commentRepository.save(comment);

        log.info("Updated comment {} by user {}", commentId, userId);
        return comment;
    }

    @Override
    @Transactional
    public void deleteComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!canUserDeleteComment(commentId, userId)) {
            throw new IllegalArgumentException("User not authorized to delete this comment");
        }

        commentRepository.delete(comment);
        log.info("Deleted comment {} by user {}", commentId, userId);
    }

    @Override
    public Comment getCommentById(UUID commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
    }

    @Override
    public Page<Comment> getStoryComments(UUID storyId, Pageable pageable) {
        return commentRepository.findByStoryIdAndParentCommentIsNullAndModerationStatusOrderByCreatedAtDesc(
                storyId, Comment.ModerationStatus.APPROVED, pageable);
    }

    @Override
    public Page<Comment> getChapterComments(UUID chapterId, Pageable pageable) {
        return commentRepository.findByChapterIdAndParentCommentIsNullAndModerationStatusOrderByCreatedAtDesc(
                chapterId, Comment.ModerationStatus.APPROVED, pageable);
    }

    @Override
    public List<Comment> getCommentReplies(UUID parentCommentId) {
        return commentRepository.findByParentCommentIdAndModerationStatusOrderByCreatedAtAsc(
                parentCommentId, Comment.ModerationStatus.APPROVED);
    }

    @Override
    public Page<Comment> getUserComments(UUID userId, Pageable pageable) {
        return commentRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Override
    public long getStoryCommentCount(UUID storyId) {
        return commentRepository.countByStoryIdAndModerationStatus(storyId, Comment.ModerationStatus.APPROVED);
    }

    @Override
    public long getChapterCommentCount(UUID chapterId) {
        return commentRepository.countByChapterIdAndModerationStatus(chapterId, Comment.ModerationStatus.APPROVED);
    }

    @Override
    public long getUserCommentCount(UUID userId) {
        return commentRepository.countByUserId(userId);
    }

    @Override
    @Transactional
    public Comment approveComment(UUID commentId, UUID moderatorId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        comment.setModerationStatus(Comment.ModerationStatus.APPROVED);
        comment = commentRepository.save(comment);

        log.info("Comment {} approved by moderator {}", commentId, moderatorId);
        return comment;
    }

    @Override
    @Transactional
    public Comment rejectComment(UUID commentId, UUID moderatorId, String reason) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        comment.setModerationStatus(Comment.ModerationStatus.REJECTED);
        comment.setModerationNotes(reason);
        comment = commentRepository.save(comment);

        log.info("Comment {} rejected by moderator {} with reason: {}", commentId, moderatorId, reason);
        return comment;
    }

    @Override
    @Transactional
    public Comment flagComment(UUID commentId, UUID userId, String reason) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        comment.setModerationStatus(Comment.ModerationStatus.PENDING);
        comment.setModerationNotes("Flagged by user: " + reason);
        comment = commentRepository.save(comment);

        log.info("Comment {} flagged by user {} with reason: {}", commentId, userId, reason);
        return comment;
    }

    @Override
    public Page<Comment> getPendingComments(Pageable pageable) {
        return commentRepository.findByModerationStatusOrderByCreatedAtAsc(
                Comment.ModerationStatus.PENDING, pageable);
    }

    @Override
    @Transactional
    public Comment pinComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        // Only story/chapter authors or admins can pin comments
        if (!canUserModerateComment(commentId, userId)) {
            throw new IllegalArgumentException("User not authorized to pin this comment");
        }

        comment.setIsPinned(true);
        comment = commentRepository.save(comment);

        log.info("Comment {} pinned by user {}", commentId, userId);
        return comment;
    }

    @Override
    @Transactional
    public Comment unpinComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!canUserModerateComment(commentId, userId)) {
            throw new IllegalArgumentException("User not authorized to unpin this comment");
        }

        comment.setIsPinned(false);
        comment = commentRepository.save(comment);

        log.info("Comment {} unpinned by user {}", commentId, userId);
        return comment;
    }

    @Override
    @Transactional
    public void likeComment(UUID commentId, UUID userId) {
        // Check if already liked
        if (hasUserLikedComment(commentId, userId)) {
            throw new IllegalArgumentException("Comment already liked by user");
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Create reaction
        Reaction reaction = Reaction.builder()
                .user(user)
                .targetType(Reaction.TargetType.COMMENT)
                .targetId(commentId)
                .reactionType(Reaction.ReactionType.LIKE)
                .build();

        reactionRepository.save(reaction);

        // Update comment like count
        comment.incrementLikes();
        commentRepository.save(comment);

        log.info("User {} liked comment {}", userId, commentId);
    }

    @Override
    @Transactional
    public void unlikeComment(UUID commentId, UUID userId) {
        if (!hasUserLikedComment(commentId, userId)) {
            throw new IllegalArgumentException("Comment not liked by user");
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        // Remove reaction
        reactionRepository.deleteByUserIdAndTargetTypeAndTargetId(
                userId, Reaction.TargetType.COMMENT, commentId);

        // Update comment like count
        comment.decrementLikes();
        commentRepository.save(comment);

        log.info("User {} unliked comment {}", userId, commentId);
    }

    @Override
    public boolean hasUserLikedComment(UUID commentId, UUID userId) {
        return reactionRepository.existsByUserIdAndTargetTypeAndTargetId(
                userId, Reaction.TargetType.COMMENT, commentId);
    }

    @Override
    public List<Comment> getPinnedComments(UUID storyId, UUID chapterId) {
        if (chapterId != null) {
            return commentRepository.findByChapterIdAndIsPinnedTrueAndModerationStatusOrderByCreatedAtDesc(
                    chapterId, Comment.ModerationStatus.APPROVED);
        } else if (storyId != null) {
            return commentRepository.findByStoryIdAndIsPinnedTrueAndModerationStatusOrderByCreatedAtDesc(
                    storyId, Comment.ModerationStatus.APPROVED);
        }
        return List.of();
    }

    @Override
    public Page<Comment> getLatestComments(Pageable pageable) {
        return commentRepository.findLatestComments(Comment.ModerationStatus.APPROVED, pageable);
    }

    @Override
    public boolean canUserEditComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null)
            return false;

        // Users can edit their own comments within 24 hours
        return comment.getUser().getId().equals(userId) &&
                comment.getCreatedAt().isAfter(java.time.LocalDateTime.now().minusHours(24));
    }

    @Override
    public boolean canUserDeleteComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null)
            return false;

        User user = userRepository.findById(userId).orElse(null);
        if (user == null)
            return false;

        // Users can delete their own comments, or admins can delete any comment
        return comment.getUser().getId().equals(userId) ||
                User.Role.ADMIN.equals(user.getRole());
    }

    @Override
    public boolean canUserModerateComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId).orElse(null);
        if (comment == null)
            return false;

        User user = userRepository.findById(userId).orElse(null);
        if (user == null)
            return false;

        // Admins can moderate any comment
        if (User.Role.ADMIN.equals(user.getRole())) {
            return true;
        }

        // Story/chapter authors can moderate comments on their content
        if (comment.getStory() != null) {
            return comment.getStory().getAuthor().getId().equals(userId);
        }

        return false;
    }

    @Override
    public Map<String, Object> getCommentStats(UUID userId) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalComments", getUserCommentCount(userId));

        // Add more stats as needed
        return stats;
    }

    @Override
    public Map<String, Object> getContentCommentStats(UUID storyId, UUID chapterId) {
        Map<String, Object> stats = new HashMap<>();

        if (chapterId != null) {
            stats.put("totalComments", getChapterCommentCount(chapterId));
        } else if (storyId != null) {
            stats.put("totalComments", getStoryCommentCount(storyId));
        }

        return stats;
    }
}