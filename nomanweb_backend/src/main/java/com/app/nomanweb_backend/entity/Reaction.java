package com.app.nomanweb_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Reaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    private TargetType targetType;

    @Column(name = "target_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID targetId;

    @Enumerated(EnumType.STRING)
    @Column(name = "reaction_type")
    @Builder.Default
    private ReactionType reactionType = ReactionType.LIKE;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // For convenience - these are not mapped to database but help with queries
    @Transient
    private Story story;

    @Transient
    private Chapter chapter;

    @Transient
    private Comment comment;

    // Enums
    public enum TargetType {
        STORY, CHAPTER, COMMENT
    }

    public enum ReactionType {
        LIKE
    }

    // Helper methods
    public boolean isStoryReaction() {
        return this.targetType == TargetType.STORY;
    }

    public boolean isChapterReaction() {
        return this.targetType == TargetType.CHAPTER;
    }

    public boolean isCommentReaction() {
        return this.targetType == TargetType.COMMENT;
    }
}