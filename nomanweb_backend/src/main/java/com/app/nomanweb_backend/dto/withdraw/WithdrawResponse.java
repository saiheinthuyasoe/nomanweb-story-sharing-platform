package com.app.nomanweb_backend.dto.withdraw;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WithdrawResponse {
    private UUID id;
    private UUID userId;
    private BigDecimal amount;
    private String bankName;
    private String accountNumber;
    private String accountHolderName;
    private String routingNumber;
    private String notes;
    private String status; // "pending", "processing", "completed", "failed", "cancelled"
    private String stripeTransferId;
    private String failureReason;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Masked account number for security
    public String getMaskedAccountNumber() {
        if (accountNumber == null || accountNumber.length() < 4) {
            return "****";
        }
        return "****" + accountNumber.substring(accountNumber.length() - 4);
    }
}