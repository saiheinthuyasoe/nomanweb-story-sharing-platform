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

/**
 * Entity to track chapter-level refunds for WHOLE_BOOK pricing.
 * This allows users to regain access to republished chapters that were
 * previously refunded.
 */
@Entity
@Table(name = "chapter_refunds")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ChapterRefund {

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_purchase_id", nullable = false)
    private BookPurchase bookPurchase;

    @Column(name = "refund_amount", precision = 8, scale = 2, nullable = false)
    private BigDecimal refundAmount;

    @CreatedDate
    @Column(name = "refunded_at", nullable = false, updatable = false)
    private LocalDateTime refundedAt;

    @Column(name = "reason")
    private String reason;

    // Note: ChapterRefund records are for tracking purposes only
    // They do NOT grant access to republished content
}