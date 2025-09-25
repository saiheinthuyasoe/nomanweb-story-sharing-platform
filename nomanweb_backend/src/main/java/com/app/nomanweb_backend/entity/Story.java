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
import com.app.nomanweb_backend.entity.GiftTransaction;
import com.app.nomanweb_backend.entity.ChapterPurchase;

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
    @Column(name = "publish_status")
    @Builder.Default
    private PublishStatus publishStatus = PublishStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "pricing_type")
    @Builder.Default
    private PricingType pricingType = PricingType.FREE;

    @Enumerated(EnumType.STRING)
    @Column(name = "book_status")
    @Builder.Default
    private BookStatus bookStatus = BookStatus.ONGOING;

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

    @Column(name = "total_want_to_read")
    @Builder.Default
    private Long totalWantToRead = 0L;

    @Column(name = "total_completed")
    @Builder.Default
    private Long totalCompleted = 0L;

    @Column(name = "total_currently_reading")
    @Builder.Default
    private Long totalCurrentlyReading = 0L;

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

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

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
    private List<Library> libraries = new ArrayList<>();

    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<GiftTransaction> giftTransactions = new ArrayList<>();

    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<ChapterPurchase> chapterPurchases = new ArrayList<>();

    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<StoryView> storyViews = new ArrayList<>();

    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<BookPurchase> bookPurchases = new ArrayList<>();

    // Enums
    public enum PublishStatus {
        DRAFT, PUBLISHED, COMPLETED, PENDING
    }

    public enum PricingType {
        FREE, PAID_PER_CHAPTER, WHOLE_BOOK
    }

    public enum BookStatus {
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

    public void incrementWantToRead() {
        this.totalWantToRead++;
    }

    public void decrementWantToRead() {
        if (this.totalWantToRead > 0) {
            this.totalWantToRead--;
        }
    }

    public void incrementCompleted() {
        this.totalCompleted++;
    }

    public void decrementCompleted() {
        if (this.totalCompleted > 0) {
            this.totalCompleted--;
        }
    }

    public void incrementCurrentlyReading() {
        this.totalCurrentlyReading++;
    }

    public void decrementCurrentlyReading() {
        if (this.totalCurrentlyReading > 0) {
            this.totalCurrentlyReading--;
        }
    }

    public void addCoinsEarned(BigDecimal amount) {
        this.totalCoinsEarned = this.totalCoinsEarned.add(amount);
    }

    public boolean isPublished() {
        return this.publishStatus == PublishStatus.PUBLISHED;
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

    // Trash management helper methods
    public void moveToTrash() {
        // Auto-unpublish if published
        if (this.publishStatus == PublishStatus.PUBLISHED) {
            this.publishStatus = PublishStatus.DRAFT;
        }

        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
    }

    public void restoreFromTrash() {
        this.isDeleted = false;
        this.deletedAt = null;
    }

    public boolean isInTrash() {
        return this.isDeleted != null && this.isDeleted;
    }
}