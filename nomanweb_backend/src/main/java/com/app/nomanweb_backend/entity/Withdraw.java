package com.app.nomanweb_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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
@Table(name = "withdraws")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Withdraw {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private User user;

    @NotNull
    @Positive
    @Column(name = "amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal amount;

    @NotBlank
    @Size(max = 100)
    @Column(name = "bank_name", nullable = false)
    private String bankName;

    @NotBlank
    @Size(max = 50)
    @Column(name = "account_number", nullable = false)
    private String accountNumber;

    @NotBlank
    @Size(max = 100)
    @Column(name = "account_holder_name", nullable = false)
    private String accountHolderName;

    @Size(max = 20)
    @Column(name = "routing_number")
    private String routingNumber;

    @Size(max = 500)
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private WithdrawStatus status = WithdrawStatus.PENDING;

    @Column(name = "stripe_transfer_id")
    private String stripeTransferId;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enums
    public enum WithdrawStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED,
        CANCELLED
    }

    // Helper methods
    public boolean isPending() {
        return this.status == WithdrawStatus.PENDING;
    }

    public boolean isProcessing() {
        return this.status == WithdrawStatus.PROCESSING;
    }

    public boolean isCompleted() {
        return this.status == WithdrawStatus.COMPLETED;
    }

    public boolean isFailed() {
        return this.status == WithdrawStatus.FAILED;
    }

    public boolean isCancelled() {
        return this.status == WithdrawStatus.CANCELLED;
    }

    public boolean canBeCancelled() {
        return this.status == WithdrawStatus.PENDING;
    }

    // Masked account number for security
    public String getMaskedAccountNumber() {
        if (accountNumber == null || accountNumber.length() < 4) {
            return "****";
        }
        return "****" + accountNumber.substring(accountNumber.length() - 4);
    }
}