package com.app.nomanweb_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "stories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private User author;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_image_url")
    private String coverImageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Category category;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "pricing_type")
    @Builder.Default
    private PricingType pricingType = PricingType.FREE;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_status")
    @Builder.Default
    private ContentStatus contentStatus = ContentStatus.ONGOING;

    @Column(name = "total_chapters")
    @Builder.Default
    private Integer totalChapters = 0;

    @Column(name = "total_views")
    @Builder.Default
    private Long totalViews = 0L;

    @Column(name = "total_likes")
    @Builder.Default
    private Long totalLikes = 0L;

    @Column(name = "total_comments")
    @Builder.Default
    private Long totalComments = 0L;

    @Column(name = "total_coins_earned", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal totalCoinsEarned = BigDecimal.ZERO;

    // Pricing fields
    @Column(name = "book_price", precision = 8, scale = 2)
    private BigDecimal bookPrice; // Price for whole book purchase

    @Column(name = "default_chapter_price", precision = 8, scale = 2)
    private BigDecimal defaultChapterPrice; // Default price per chapter

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "moderation_status")
    @Builder.Default
    private ModerationStatus moderationStatus = ModerationStatus.PENDING;

    @Column(name = "moderation_notes", columnDefinition = "TEXT")
    private String moderationNotes;

    @Column(name = "tags", columnDefinition = "json")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> tags; // JSON array of tags

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    // Relationships
    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Chapter> chapters = new ArrayList<>();

    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<ReadingProgress> readingProgress = new ArrayList<>();

    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<ReadingList> readingLists = new ArrayList<>();

    // Enums
    public enum Status {
        DRAFT, PUBLISHED, COMPLETED, SUSPENDED
    }

    public enum PricingType {
        FREE, PAID_PER_CHAPTER, WHOLE_BOOK
    }

    public enum ContentStatus {
        ONGOING, COMPLETED
    }

    public enum ModerationStatus {
        PENDING, APPROVED, REJECTED
    }

    // Helper methods
    public void incrementViews() {
        this.totalViews++;
    }

    public void incrementLikes() {
        this.totalLikes++;
    }

    public void decrementLikes() {
        if (this.totalLikes > 0) {
            this.totalLikes--;
        }
    }

    public void incrementComments() {
        this.totalComments++;
    }

    public void decrementComments() {
        if (this.totalComments > 0) {
            this.totalComments--;
        }
    }

    public void addCoinsEarned(BigDecimal amount) {
        this.totalCoinsEarned = this.totalCoinsEarned.add(amount);
    }

    public boolean isPublished() {
        return this.status == Status.PUBLISHED;
    }

    public boolean isApproved() {
        return this.moderationStatus == ModerationStatus.APPROVED;
    }

    public boolean isFree() {
        return this.pricingType == PricingType.FREE;
    }

    public boolean isPaidPerChapter() {
        return this.pricingType == PricingType.PAID_PER_CHAPTER;
    }

    public boolean isWholeBook() {
        return this.pricingType == PricingType.WHOLE_BOOK;
    }

    public boolean isPaid() {
        return this.pricingType == PricingType.PAID_PER_CHAPTER || this.pricingType == PricingType.WHOLE_BOOK;
    }
}