package com.app.nomanweb_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "featured_content")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class FeaturedContent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Story story;

    @Enumerated(EnumType.STRING)
    @Column(name = "section_type", nullable = false)
    private SectionType sectionType;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private User createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum SectionType {
        FEATURED_STORIES, // Main hero section
        NEW_RELEASES, // Recently published stories
        RECOMMENDED_FOR_YOU, // Personalized recommendations
        WEEKLY_FEATURES, // Weekly featured content
        BEST_OF_ALL_TIME, // All-time popular stories
        BEST_RATING, // Highest rated stories
        TRENDING_NOW, // Currently trending
        EDITOR_CHOICE, // Editor's picks
        HOMEPAGE_CAROUSEL, // Homepage carousel display
        // Genre-specific sections
        ADVENTURE, // Adventure genre books
        COMEDY, // Comedy genre books
        DRAMA, // Drama genre books
        FANTASY, // Fantasy genre books
        HORROR, // Horror genre books
        MYSTERY, // Mystery genre books
        ROMANCE, // Romance genre books
        SCIENCE_FICTION, // Science Fiction genre books
        THRILLER, // Thriller genre books
        YOUNG_ADULT // Young Adult genre books
    }

    // Helper methods
    public boolean isCurrentlyActive() {
        if (!isActive) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();

        if (startDate != null && now.isBefore(startDate)) {
            return false;
        }

        if (endDate != null && now.isAfter(endDate)) {
            return false;
        }

        return true;
    }

    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }
}