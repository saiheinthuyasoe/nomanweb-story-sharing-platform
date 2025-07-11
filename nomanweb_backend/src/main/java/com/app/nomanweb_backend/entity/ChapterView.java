package com.app.nomanweb_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
@Table(name = "chapter_views", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "chapter_id" })
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class ChapterView {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    @JsonIgnore
    private Chapter chapter;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 1;

    @CreatedDate
    @Column(name = "first_viewed_at", nullable = false, updatable = false)
    private LocalDateTime firstViewedAt;

    @Column(name = "last_viewed_at", nullable = false)
    private LocalDateTime lastViewedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        if (lastViewedAt == null) {
            lastViewedAt = LocalDateTime.now();
        }
    }
}