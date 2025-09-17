package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.withdraw.WithdrawRequest;
import com.app.nomanweb_backend.dto.withdraw.WithdrawResponse;
import com.app.nomanweb_backend.entity.Withdraw;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface WithdrawService {

    /**
     * Create a new withdrawal request
     */
    WithdrawResponse createWithdrawRequest(WithdrawRequest request, UUID userId);

    /**
     * Get withdrawal history for a user
     */
    Page<WithdrawResponse> getWithdrawHistory(UUID userId, int page, int size);

    /**
     * Get withdrawal by ID
     */
    WithdrawResponse getWithdrawById(UUID withdrawId, UUID userId);

    /**
     * Cancel a pending withdrawal
     */
    WithdrawResponse cancelWithdraw(UUID withdrawId, UUID userId);

    /**
     * Process withdrawal (admin/system use)
     */
    WithdrawResponse processWithdraw(UUID withdrawId);

    /**
     * Reject withdrawal (admin/system use)
     */
    WithdrawResponse rejectWithdraw(UUID withdrawId, String reason);

    /**
     * Get all withdrawals for admin
     */
    Page<WithdrawResponse> getAllWithdrawals(int page, int size, Withdraw.WithdrawStatus status);

    /**
     * Get user's total pending withdrawal amount
     */
    BigDecimal getUserPendingWithdrawAmount(UUID userId);

    /**
     * Check if user can withdraw (has sufficient balance, no pending withdrawals,
     * etc.)
     */
    boolean canUserWithdraw(UUID userId, BigDecimal amount);

    /**
     * Get withdrawal statistics for admin dashboard
     */
    WithdrawStats getWithdrawStats(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Statistics class for withdrawal data
     */
    class WithdrawStats {
        private final long totalRequests;
        private final BigDecimal totalAmount;
        private final long pendingCount;
        private final long processedCount;
        private final long rejectedCount;

        public WithdrawStats(long totalRequests, BigDecimal totalAmount, long pendingCount,
                long processedCount, long rejectedCount) {
            this.totalRequests = totalRequests;
            this.totalAmount = totalAmount;
            this.pendingCount = pendingCount;
            this.processedCount = processedCount;
            this.rejectedCount = rejectedCount;
        }

        // Getters
        public long getTotalRequests() {
            return totalRequests;
        }

        public BigDecimal getTotalAmount() {
            return totalAmount;
        }

        public long getPendingCount() {
            return pendingCount;
        }

        public long getProcessedCount() {
            return processedCount;
        }

        public long getRejectedCount() {
            return rejectedCount;
        }
    }
}