package com.app.nomanweb_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id")
    private Story story;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id")
    private Chapter chapter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private Comment parentComment;

    @NotBlank
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Builder.Default
    private Long likes = 0L;

    @Column(name = "is_pinned")
    @Builder.Default
    private Boolean isPinned = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "moderation_status")
    @Builder.Default
    private ModerationStatus moderationStatus = ModerationStatus.APPROVED;

    @Column(name = "moderation_notes", columnDefinition = "TEXT")
    private String moderationNotes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Comment> replies = new ArrayList<>();

    // Note: Reactions are handled via target_id pattern, not direct relationship
    // Use ReactionRepository to find reactions for this comment

    // Enums
    public enum ModerationStatus {
        PENDING, APPROVED, REJECTED
    }

    // Helper methods
    public void incrementLikes() {
        this.likes++;
    }

    public void decrementLikes() {
        if (this.likes > 0) {
            this.likes--;
        }
    }

    public boolean isReply() {
        return this.parentComment != null;
    }

    public boolean isApproved() {
        return this.moderationStatus == ModerationStatus.APPROVED;
    }

    public boolean hasReplies() {
        return this.replies != null && !this.replies.isEmpty();
    }
}