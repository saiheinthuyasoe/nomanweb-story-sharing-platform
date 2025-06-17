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
@Table(name = "coin_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class CoinTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;

    @Column(name = "amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "balance_before", precision = 10, scale = 2, nullable = false)
    private BigDecimal balanceBefore;

    @Column(name = "balance_after", precision = 10, scale = 2, nullable = false)
    private BigDecimal balanceAfter;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "reference_type")
    @Enumerated(EnumType.STRING)
    private ReferenceType referenceType;

    @Column(name = "reference_id", columnDefinition = "BINARY(16)")
    private UUID referenceId;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.COMPLETED;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Enums
    public enum TransactionType {
        PURCHASE, EARNING, REFUND, BONUS, PENALTY
    }

    public enum ReferenceType {
        CHAPTER, STORY, SYSTEM
    }

    public enum Status {
        PENDING, COMPLETED, FAILED, CANCELLED
    }

    // Helper methods
    public boolean isEarning() {
        return this.transactionType == TransactionType.EARNING;
    }

    public boolean isPurchase() {
        return this.transactionType == TransactionType.PURCHASE;
    }

    public boolean isCompleted() {
        return this.status == Status.COMPLETED;
    }
}