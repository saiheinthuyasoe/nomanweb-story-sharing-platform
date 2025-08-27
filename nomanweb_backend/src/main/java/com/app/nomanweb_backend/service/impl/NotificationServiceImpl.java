package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.entity.Notification;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.Comment;
import com.app.nomanweb_backend.repository.NotificationRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.repository.UserFollowRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.ChapterRepository;
import com.app.nomanweb_backend.repository.CommentRepository;
import com.app.nomanweb_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final UserFollowRepository userFollowRepository;
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final CommentRepository commentRepository;



    @Override
    @Transactional
    public Notification createNotification(UUID userId, Notification.NotificationType type,
            String title, String message,
            Notification.RelatedType relatedType, UUID relatedId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .relatedType(relatedType)
                .relatedId(relatedId)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        log.info("Created notification for user {}: {}", userId, type);
        return notification;
    }

    @Override
    @Transactional
    public Notification createNotification(User user, Notification.NotificationType type,
            String title, String message,
            Notification.RelatedType relatedType, UUID relatedId) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .relatedType(relatedType)
                .relatedId(relatedId)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        log.info("Created notification for user {}: {}", user.getId(), type);
        return notification;
    }

    @Override
    @Transactional
    public Notification updateNotification(Notification notification) {
        notification = notificationRepository.save(notification);
        log.debug("Updated notification {}", notification.getId());
        return notification;
    }

    @Override
    public Page<Notification> getUserNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Override
    public Page<Notification> getUnreadNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable);
    }

    @Override
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(UUID notificationId) {
        notificationRepository.markAsRead(notificationId, LocalDateTime.now());
        log.debug("Marked notification {} as read", notificationId);
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsReadByUserId(userId, LocalDateTime.now());
        log.info("Marked all notifications as read for user {}", userId);
    }

    @Override
    @Transactional
    public void deleteNotification(UUID notificationId) {
        notificationRepository.deleteById(notificationId);
        log.debug("Deleted notification {}", notificationId);
    }

    @Override
    @Transactional
    public void bulkDeleteNotifications(List<UUID> notificationIds, UUID userId) {
        // Verify that all notifications belong to the user before deleting
        List<Notification> userNotifications = notificationRepository.findAllById(notificationIds)
                .stream()
                .filter(notification -> notification.getUser().getId().equals(userId))
                .toList();

        if (userNotifications.size() != notificationIds.size()) {
            log.warn("Some notifications do not belong to user {} or do not exist", userId);
        }

        List<UUID> validNotificationIds = userNotifications.stream()
                .map(Notification::getId)
                .toList();

        notificationRepository.deleteAllById(validNotificationIds);
        log.info("Bulk deleted {} notifications for user {}", validNotificationIds.size(), userId);
    }

    @Override
    @Transactional
    public void notifyNewFollower(UUID followedUserId, UUID followerUserId) {
        try {
            User followedUser = userRepository.findById(followedUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Followed user not found"));
            User follower = userRepository.findById(followerUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Follower not found"));

            String title = "New Follower";
            String message = String.format("%s is now following you!",
                    follower.getDisplayName() != null ? follower.getDisplayName() : follower.getUsername());

            createNotification(followedUser, Notification.NotificationType.FOLLOW,
                    title, message, Notification.RelatedType.USER, followerUserId);
        } catch (Exception e) {
            log.error("Failed to send new follower notification", e);
        }
    }

    @Override
    @Transactional
    public void notifyNewStory(UUID authorId, UUID storyId) {
        try {
            Story story = storyRepository.findById(storyId)
                    .orElseThrow(() -> new IllegalArgumentException("Story not found"));

            String title = "New Story Published";
            String message = String.format("%s published a new story: %s",
                    story.getAuthor().getDisplayName() != null ? story.getAuthor().getDisplayName()
                            : story.getAuthor().getUsername(),
                    story.getTitle());

            sendNotificationsToFollowers(authorId, title, message,
                    Notification.NotificationType.NEW_STORY,
                    Notification.RelatedType.STORY, storyId);
        } catch (Exception e) {
            log.error("Failed to send new story notifications", e);
        }
    }

    @Override
    @Transactional
    public void notifyNewChapter(UUID authorId, UUID storyId, UUID chapterId) {
        try {
            Chapter chapter = chapterRepository.findById(chapterId)
                    .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

            String title = "New Chapter Available";
            String message = String.format("New chapter published: %s - %s",
                    chapter.getStory().getTitle(), chapter.getTitle());

            sendNotificationsToFollowers(authorId, title, message,
                    Notification.NotificationType.NEW_CHAPTER,
                    Notification.RelatedType.CHAPTER, chapterId);
        } catch (Exception e) {
            log.error("Failed to send new chapter notifications", e);
        }
    }

    @Override
    @Transactional
    public void notifyStoryLike(UUID storyAuthorId, UUID likerId, UUID storyId) {
        try {
            // Don't notify if user likes their own story
            if (storyAuthorId.equals(likerId)) {
                return;
            }

            User storyAuthor = userRepository.findById(storyAuthorId)
                    .orElseThrow(() -> new IllegalArgumentException("Story author not found"));
            User liker = userRepository.findById(likerId)
                    .orElseThrow(() -> new IllegalArgumentException("Liker not found"));
            Story story = storyRepository.findById(storyId)
                    .orElseThrow(() -> new IllegalArgumentException("Story not found"));

            String title = "Story Liked";
            String message = String.format("%s liked your story: %s",
                    liker.getDisplayName() != null ? liker.getDisplayName() : liker.getUsername(),
                    story.getTitle());

            createNotification(storyAuthor, Notification.NotificationType.LIKE,
                    title, message, Notification.RelatedType.STORY, storyId);
        } catch (Exception e) {
            log.error("Failed to send story like notification", e);
        }
    }

    @Override
    @Transactional
    public void notifyChapterLike(UUID chapterAuthorId, UUID likerId, UUID chapterId) {
        try {
            // Don't notify if user likes their own chapter
            if (chapterAuthorId.equals(likerId)) {
                return;
            }

            User chapterAuthor = userRepository.findById(chapterAuthorId)
                    .orElseThrow(() -> new IllegalArgumentException("Chapter author not found"));
            User liker = userRepository.findById(likerId)
                    .orElseThrow(() -> new IllegalArgumentException("Liker not found"));
            Chapter chapter = chapterRepository.findById(chapterId)
                    .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

            String title = "Chapter Liked";
            String message = String.format("%s liked your chapter: %s from story: %s",
                    liker.getDisplayName() != null ? liker.getDisplayName() : liker.getUsername(),
                    chapter.getTitle(),
                    chapter.getStory().getTitle());

            createNotification(chapterAuthor,
                    Notification.NotificationType.LIKE,
                    title, message, Notification.RelatedType.CHAPTER, chapterId);
        } catch (Exception e) {
            log.error("Failed to send chapter like notification", e);
        }
    }

    @Override
    @Transactional
    public void notifyCommentLike(UUID commentAuthorId, UUID likerId, UUID commentId) {
        try {
            // Don't notify if user likes their own comment
            if (commentAuthorId.equals(likerId)) {
                return;
            }

            User liker = userRepository.findById(likerId)
                    .orElseThrow(() -> new IllegalArgumentException("Liker not found"));
            Comment comment = commentRepository.findById(commentId)
                    .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

            String title;
            String message;
            String commentPreview = comment.getContent().length() > 50 ? comment.getContent().substring(0, 50) + "..."
                    : comment.getContent();

            if (comment.getChapter() != null) {
                title = "Chapter Comment Liked";
                message = String.format("%s liked your comment \"%s\" on chapter: %s",
                        liker.getDisplayName() != null ? liker.getDisplayName() : liker.getUsername(),
                        commentPreview,
                        comment.getChapter().getTitle());
            } else {
                title = "Story Comment Liked";
                message = String.format("%s liked your comment \"%s\" on story: %s",
                        liker.getDisplayName() != null ? liker.getDisplayName() : liker.getUsername(),
                        commentPreview,
                        comment.getStory().getTitle());
            }

            createNotification(commentAuthorId, Notification.NotificationType.LIKE,
                    title, message, Notification.RelatedType.COMMENT, commentId);
        } catch (Exception e) {
            log.error("Failed to send comment like notification", e);
        }
    }

    @Override
    @Transactional
    public void notifyNewComment(UUID contentAuthorId, UUID commenterId, UUID storyId, UUID chapterId, UUID commentId) {
        try {
            // Don't notify if user comments on their own content
            if (contentAuthorId.equals(commenterId)) {
                return;
            }

            User commenter = userRepository.findById(commenterId)
                    .orElseThrow(() -> new IllegalArgumentException("Commenter not found"));

            String title;
            String message;
            Notification.RelatedType relatedType;
            UUID relatedId;

            if (chapterId != null) {
                Chapter chapter = chapterRepository.findById(chapterId)
                        .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));
                title = "Chapter Comment";
                message = String.format("%s commented on your chapter: %s",
                        commenter.getDisplayName() != null ? commenter.getDisplayName() : commenter.getUsername(),
                        chapter.getTitle());
                relatedType = Notification.RelatedType.CHAPTER;
                relatedId = chapterId;
            } else {
                Story story = storyRepository.findById(storyId)
                        .orElseThrow(() -> new IllegalArgumentException("Story not found"));
                title = "Story Comment";
                message = String.format("%s commented on your story: %s",
                        commenter.getDisplayName() != null ? commenter.getDisplayName() : commenter.getUsername(),
                        story.getTitle());
                relatedType = Notification.RelatedType.STORY;
                relatedId = storyId;
            }

            createNotification(contentAuthorId, Notification.NotificationType.COMMENT,
                    title, message, relatedType, relatedId);
        } catch (Exception e) {
            log.error("Failed to send comment notification", e);
        }
    }

    @Override
    @Transactional
    public void notifyCommentReply(UUID parentCommentAuthorId, UUID replierId, UUID commentId) {
        try {
            // Don't notify if user replies to their own comment
            if (parentCommentAuthorId.equals(replierId)) {
                return;
            }

            User replier = userRepository.findById(replierId)
                    .orElseThrow(() -> new IllegalArgumentException("Replier not found"));

            String title = "Comment Reply";
            String message = String.format("%s replied to your comment",
                    replier.getDisplayName() != null ? replier.getDisplayName() : replier.getUsername());

            createNotification(parentCommentAuthorId, Notification.NotificationType.COMMENT,
                    title, message, Notification.RelatedType.COMMENT, commentId);
        } catch (Exception e) {
            log.error("Failed to send comment reply notification", e);
        }
    }

    @Override
    @Transactional
    public void sendNotificationsToFollowers(UUID authorId, String title, String message,
            Notification.NotificationType type,
            Notification.RelatedType relatedType, UUID relatedId) {
        try {
            // Get all followers of the author
            List<User> followers = userFollowRepository.findFollowersByUserId(authorId, Pageable.unpaged())
                    .getContent()
                    .stream()
                    .map(follow -> follow.getFollower())
                    .toList();

            // Send notifications to all followers
            for (User follower : followers) {
                createNotification(follower, type,
                        title, message, relatedType, relatedId);
            }

            log.info("Sent {} notifications to {} followers of user {}", type, followers.size(), authorId);
        } catch (Exception e) {
            log.error("Failed to send notifications to followers", e);
        }
    }

    @Override
    @Transactional
    public void sendSystemNotification(UUID userId, String title, String message) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            createNotification(user, Notification.NotificationType.SYSTEM,
                    title, message, null, null);
        } catch (Exception e) {
            log.error("Failed to send system notification", e);
        }
    }

    @Override
    @Transactional
    public void sendBulkSystemNotification(List<UUID> userIds, String title, String message) {
        for (UUID userId : userIds) {
            sendSystemNotification(userId, title, message);
        }
        log.info("Sent system notification to {} users", userIds.size());
    }

    @Override
    @Transactional
    public void cleanupOldNotifications(int daysToKeep) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
        notificationRepository.deleteOldNotifications(cutoffDate);
        log.info("Cleaned up notifications older than {} days", daysToKeep);
    }

    @Override
    public Map<String, Long> getNotificationStats(UUID userId) {
        Map<String, Long> stats = new HashMap<>();

        stats.put("total", notificationRepository.countByUserIdAndType(userId, null));
        stats.put("unread", getUnreadCount(userId));

        for (Notification.NotificationType type : Notification.NotificationType.values()) {
            stats.put(type.name().toLowerCase(),
                    notificationRepository.countByUserIdAndType(userId, type));
        }

        return stats;
    }
}