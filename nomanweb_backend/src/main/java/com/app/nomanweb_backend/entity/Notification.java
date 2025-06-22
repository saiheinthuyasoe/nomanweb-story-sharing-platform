package com.app.nomanweb_backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "related_type")
    private RelatedType relatedType;

    @Column(name = "related_id")
    private UUID relatedId;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "sent_via_line")
    @Builder.Default
    private Boolean sentViaLine = false;

    @Column(name = "line_message_id")
    private String lineMessageId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    // Enums
    public enum NotificationType {
        NEW_CHAPTER, NEW_STORY, GIFT_RECEIVED, COMMENT, LIKE, FOLLOW, SYSTEM
    }

    public enum RelatedType {
        STORY, CHAPTER, USER, GIFT, COMMENT
    }

    // Helper methods
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }

    public boolean isUnread() {
        return !this.isRead;
    }

    public boolean isFollowNotification() {
        return this.type == NotificationType.FOLLOW;
    }

    public boolean isCommentNotification() {
        return this.type == NotificationType.COMMENT;
    }

    public boolean isLikeNotification() {
        return this.type == NotificationType.LIKE;
    }

    public boolean isNewContentNotification() {
        return this.type == NotificationType.NEW_CHAPTER || this.type == NotificationType.NEW_STORY;
    }
}