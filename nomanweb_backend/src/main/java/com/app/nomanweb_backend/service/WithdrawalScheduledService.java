package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.Withdraw;
import com.app.nomanweb_backend.repository.WithdrawRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WithdrawalScheduledService {

    private final WithdrawRepository withdrawRepository;
    private final WithdrawService withdrawService;
    private final StripeWithdrawService stripeWithdrawService;

    /**
     * Process pending withdrawals automatically every 5 minutes
     * This simulates automated processing that might happen in a real system
     */
    @Scheduled(fixedRate = 300000) // 5 minutes = 300,000 milliseconds
    @Transactional
    public void processAutomaticWithdrawals() {
        if (!stripeWithdrawService.isSimulationMode()) {
            log.debug("Automatic processing disabled in real Stripe mode");
            return;
        }

        log.info("Starting automatic withdrawal processing...");
        
        try {
            // Find pending withdrawals older than 2 minutes (to simulate processing delay)
            LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(2);
            List<Withdraw> pendingWithdrawals = withdrawRepository.findPendingWithdrawalsOlderThan(
                cutoffTime, PageRequest.of(0, 10)
            );

            if (pendingWithdrawals.isEmpty()) {
                log.debug("No pending withdrawals found for automatic processing");
                return;
            }

            log.info("Found {} pending withdrawals for automatic processing", pendingWithdrawals.size());

            for (Withdraw withdrawal : pendingWithdrawals) {
                try {
                    // Simulate automatic approval criteria
                    if (shouldAutoApprove(withdrawal)) {
                        log.info("Auto-approving withdrawal: {} for amount: {}", 
                            withdrawal.getId(), withdrawal.getAmount());
                        withdrawService.processWithdraw(withdrawal.getId());
                    } else {
                        log.info("Withdrawal {} requires manual review", withdrawal.getId());
                        // Could add to a manual review queue here
                    }
                } catch (Exception e) {
                    log.error("Failed to auto-process withdrawal {}: {}", 
                        withdrawal.getId(), e.getMessage());
                    // Continue processing other withdrawals
                }
            }

        } catch (Exception e) {
            log.error("Error during automatic withdrawal processing", e);
        }
    }

    /**
     * Check transfer statuses and update completed withdrawals every 10 minutes
     */
    @Scheduled(fixedRate = 600000) // 10 minutes = 600,000 milliseconds
    @Transactional
    public void updateTransferStatuses() {
        log.info("Checking transfer statuses...");
        
        try {
            // Find processing withdrawals with transfer IDs
            List<Withdraw> processingWithdrawals = withdrawRepository.findByStatusAndStripeTransferIdIsNotNull(
                Withdraw.WithdrawStatus.PROCESSING
            );

            if (processingWithdrawals.isEmpty()) {
                log.debug("No processing withdrawals with transfer IDs found");
                return;
            }

            log.info("Checking status for {} processing withdrawals", processingWithdrawals.size());

            for (Withdraw withdrawal : processingWithdrawals) {
                try {
                    String status = stripeWithdrawService.getTransferStatus(withdrawal.getStripeTransferId());
                    
                    if ("paid".equals(status)) {
                        withdrawal.setStatus(Withdraw.WithdrawStatus.COMPLETED);
                        withdrawal.setProcessedAt(LocalDateTime.now());
                        withdrawRepository.save(withdrawal);
                        log.info("Withdrawal {} marked as completed", withdrawal.getId());
                    } else if ("failed".equals(status)) {
                        withdrawal.setStatus(Withdraw.WithdrawStatus.FAILED);
                        withdrawal.setFailureReason("Transfer failed in Stripe");
                        withdrawRepository.save(withdrawal);
                        log.warn("Withdrawal {} marked as failed", withdrawal.getId());
                    }
                    // "pending" status - keep as PROCESSING
                    
                } catch (Exception e) {
                    log.error("Failed to check status for withdrawal {}: {}", 
                        withdrawal.getId(), e.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Error during transfer status update", e);
        }
    }

    /**
     * Clean up old completed/failed withdrawals (keep for 90 days)
     */
    @Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
    @Transactional
    public void cleanupOldWithdrawals() {
        log.info("Starting cleanup of old withdrawals...");
        
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(90);
            
            // Find old completed/failed withdrawals
            List<Withdraw> oldWithdrawals = withdrawRepository.findOldCompletedWithdrawals(cutoffDate);
            
            if (!oldWithdrawals.isEmpty()) {
                log.info("Found {} old withdrawals to archive", oldWithdrawals.size());
                
                // In a real system, you might archive to a separate table
                // For now, we'll just log the cleanup
                for (Withdraw withdrawal : oldWithdrawals) {
                    log.debug("Would archive withdrawal: {} from {}", 
                        withdrawal.getId(), withdrawal.getCreatedAt());
                }
            }
            
        } catch (Exception e) {
            log.error("Error during withdrawal cleanup", e);
        }
    }

    /**
     * Determine if a withdrawal should be automatically approved
     */
    private boolean shouldAutoApprove(Withdraw withdrawal) {
        // Auto-approve criteria (customize based on business rules):
        // 1. Amount is under $500
        // 2. User has no recent failed withdrawals
        // 3. Bank details are validated
        
        // Amount check
        if (withdrawal.getAmount().compareTo(java.math.BigDecimal.valueOf(500)) > 0) {
            log.debug("Withdrawal {} exceeds auto-approval limit", withdrawal.getId());
            return false;
        }
        
        // Bank validation check
        if (!stripeWithdrawService.validateBankAccount(
                withdrawal.getBankName(), 
                withdrawal.getAccountNumber(), 
                withdrawal.getRoutingNumber())) {
            log.debug("Withdrawal {} failed bank validation", withdrawal.getId());
            return false;
        }
        
        // Additional checks could include:
        // - User verification status
        // - Recent withdrawal history
        // - Risk scoring
        
        return true;
    }

    /**
     * Get statistics about automatic processing
     */
    public AutoProcessingStats getAutoProcessingStats() {
        LocalDateTime last24Hours = LocalDateTime.now().minusHours(24);
        
        long autoProcessedCount = withdrawRepository.countAutoProcessedWithdrawals(last24Hours);
        long pendingCount = withdrawRepository.countByStatus(Withdraw.WithdrawStatus.PENDING);
        long processingCount = withdrawRepository.countByStatus(Withdraw.WithdrawStatus.PROCESSING);
        
        return new AutoProcessingStats(autoProcessedCount, pendingCount, processingCount);
    }

    /**
     * Statistics class for auto-processing metrics
     */
    public static class AutoProcessingStats {
        private final long autoProcessedLast24h;
        private final long currentPending;
        private final long currentProcessing;
        
        public AutoProcessingStats(long autoProcessedLast24h, long currentPending, long currentProcessing) {
            this.autoProcessedLast24h = autoProcessedLast24h;
            this.currentPending = currentPending;
            this.currentProcessing = currentProcessing;
        }
        
        public long getAutoProcessedLast24h() { return autoProcessedLast24h; }
        public long getCurrentPending() { return currentPending; }
        public long getCurrentProcessing() { return currentProcessing; }
    }
}