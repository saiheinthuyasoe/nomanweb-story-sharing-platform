package com.app.nomanweb_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "libraries", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "story_id", "list_type" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Library {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Story story;

    @Enumerated(EnumType.STRING)
    @Column(name = "list_type", nullable = false)
    private ListType listType;

    @CreatedDate
    @Column(name = "added_at", nullable = false, updatable = false)
    private LocalDateTime addedAt;

    // Enums
    public enum ListType {
        READING,
        COMPLETED,
        LIKE,
        WANT_TO_READ,
        PURCHASED,
        HISTORY
    }

    // Helper methods
    public boolean isReading() {
        return this.listType == ListType.READING;
    }

    public boolean isLike() {
        return this.listType == ListType.LIKE;
    }

    public boolean isPurchased() {
        return this.listType == ListType.PURCHASED;
    }

    public boolean isHistory() {
        return this.listType == ListType.HISTORY;
    }

}