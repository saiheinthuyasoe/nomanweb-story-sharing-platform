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
@Table(name = "reading_lists")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ReadingList {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false)
    private Story story;

    @Enumerated(EnumType.STRING)
    @Column(name = "list_type", nullable = false)
    private ListType listType;

    @CreatedDate
    @Column(name = "added_at", nullable = false, updatable = false)
    private LocalDateTime addedAt;

    // Enums
    public enum ListType {
        READING, COMPLETED, FAVORITE, WANT_TO_READ
    }

    // Helper methods
    public boolean isReading() {
        return this.listType == ListType.READING;
    }

    public boolean isCompleted() {
        return this.listType == ListType.COMPLETED;
    }

    public boolean isFavorite() {
        return this.listType == ListType.FAVORITE;
    }

    public boolean isWantToRead() {
        return this.listType == ListType.WANT_TO_READ;
    }
}