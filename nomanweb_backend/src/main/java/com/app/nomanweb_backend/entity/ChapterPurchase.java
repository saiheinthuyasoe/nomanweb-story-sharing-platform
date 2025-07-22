package com.app.nomanweb_backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chapter_purchases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ChapterPurchase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    private Chapter chapter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable = false)
    private Story story;

    @Column(name = "coins_spent", precision = 8, scale = 2, nullable = false)
    private BigDecimal coinsSpent;

    @CreatedDate
    @Column(name = "purchased_at", nullable = false, updatable = false)
    private LocalDateTime purchasedAt;

    @Column(name = "is_refunded")
    @Builder.Default
    private Boolean isRefunded = false;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    // Helper methods
    public BigDecimal getAuthorEarnings() {
        // Authors get 70% of chapter purchase (30% platform fee)
        return coinsSpent.multiply(new BigDecimal("0.70"));
    }

    public void markAsRefunded() {
        this.isRefunded = true;
        this.refundedAt = LocalDateTime.now();
    }

    public boolean isActive() {
        return !Boolean.TRUE.equals(this.isRefunded);
    }
}