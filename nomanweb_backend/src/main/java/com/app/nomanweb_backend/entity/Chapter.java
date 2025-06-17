package com.app.nomanweb_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "chapters")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Chapter {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false)
    private Story story;

    @Column(name = "chapter_number", nullable = false)
    private Integer chapterNumber;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "word_count")
    @Builder.Default
    private Integer wordCount = 0;

    @Column(name = "coin_price", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal coinPrice = BigDecimal.ZERO;

    @Column(name = "is_free")
    @Builder.Default
    private Boolean isFree = true;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.DRAFT;

    @Builder.Default
    private Long views = 0L;

    @Builder.Default
    private Long likes = 0L;

    @Enumerated(EnumType.STRING)
    @Column(name = "moderation_status")
    @Builder.Default
    private ModerationStatus moderationStatus = ModerationStatus.PENDING;

    @Column(name = "moderation_notes", columnDefinition = "TEXT")
    private String moderationNotes;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    // Relationships
    @OneToMany(mappedBy = "chapter", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "chapter", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<ReadingProgress> readingProgress = new ArrayList<>();

    // Enums
    public enum Status {
        DRAFT, PUBLISHED
    }

    public enum ModerationStatus {
        PENDING, APPROVED, REJECTED
    }

    // Helper methods
    public void incrementViews() {
        this.views++;
    }

    public void incrementLikes() {
        this.likes++;
    }

    public void decrementLikes() {
        if (this.likes > 0) {
            this.likes--;
        }
    }

    public boolean isPublished() {
        return this.status == Status.PUBLISHED;
    }

    public boolean isApproved() {
        return this.moderationStatus == ModerationStatus.APPROVED;
    }

    public boolean isPaid() {
        return !this.isFree && this.coinPrice.compareTo(BigDecimal.ZERO) > 0;
    }

    public void updateWordCount() {
        if (this.content != null) {
            // Strip HTML tags and count actual words
            String textContent = this.content.replaceAll("<[^>]*>", " ") // Remove HTML tags
                    .replaceAll("\\s+", " ") // Normalize whitespace
                    .trim();
            if (textContent.isEmpty()) {
                this.wordCount = 0;
            } else {
                this.wordCount = textContent.split("\\s+").length;
            }
        } else {
            this.wordCount = 0;
        }
    }
}