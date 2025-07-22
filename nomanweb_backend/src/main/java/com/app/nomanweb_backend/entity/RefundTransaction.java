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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "refund_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class RefundTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id")
    private Story story;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id")
    private Chapter chapter;

    @Column(name = "refund_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal refundAmount;

    @Column(name = "original_purchase_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal originalPurchaseAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "refund_type", nullable = false)
    private RefundType refundType;

    @Enumerated(EnumType.STRING)
    @Column(name = "refund_status", nullable = false)
    @Builder.Default
    private RefundStatus refundStatus = RefundStatus.PENDING;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by_admin_id")
    private User processedByAdmin;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    // Enums
    public enum RefundType {
        STORY_DELETION,
        CHAPTER_DELETION,
        STORY_UNPUBLISH,
        CHAPTER_UNPUBLISH,
        PRICING_CHANGE_TO_FREE,
        PRICING_CHANGE,
        MANUAL_REFUND
    }

    public enum RefundStatus {
        PENDING,
        APPROVED,
        REJECTED,
        COMPLETED,
        FAILED
    }

    // Helper methods
    public boolean isPending() {
        return refundStatus == RefundStatus.PENDING;
    }

    public boolean isApproved() {
        return refundStatus == RefundStatus.APPROVED;
    }

    public boolean isCompleted() {
        return refundStatus == RefundStatus.COMPLETED;
    }

    public boolean isFailed() {
        return refundStatus == RefundStatus.FAILED;
    }

    public void approve(User admin) {
        this.refundStatus = RefundStatus.APPROVED;
        this.processedByAdmin = admin;
        this.processedAt = LocalDateTime.now();
    }

    public void reject(User admin, String reason) {
        this.refundStatus = RefundStatus.REJECTED;
        this.processedByAdmin = admin;
        this.adminNotes = reason;
        this.processedAt = LocalDateTime.now();
    }

    public void complete() {
        this.refundStatus = RefundStatus.COMPLETED;
        this.processedAt = LocalDateTime.now();
    }

    public void fail(String reason) {
        this.refundStatus = RefundStatus.FAILED;
        this.adminNotes = reason;
        this.processedAt = LocalDateTime.now();
    }
}