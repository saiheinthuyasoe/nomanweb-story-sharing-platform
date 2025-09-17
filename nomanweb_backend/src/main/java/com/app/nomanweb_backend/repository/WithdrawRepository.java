package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.Withdraw;
import com.app.nomanweb_backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface WithdrawRepository extends JpaRepository<Withdraw, UUID> {

        // Find withdrawals by user ordered by creation date
        Page<Withdraw> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

        // Find withdrawals by user as list
        List<Withdraw> findByUserOrderByCreatedAtDesc(User user);

        // Find withdrawals by status
        Page<Withdraw> findByStatusOrderByCreatedAtDesc(Withdraw.WithdrawStatus status, Pageable pageable);

        // Find withdrawals by user and status
        List<Withdraw> findByUserAndStatusOrderByCreatedAtDesc(User user, Withdraw.WithdrawStatus status);

        // Find withdrawals by user ID
        Page<Withdraw> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

        // Find withdrawals by user ID as list
        List<Withdraw> findByUserIdOrderByCreatedAtDesc(UUID userId);

        // Find withdrawals by Stripe transfer ID
        List<Withdraw> findByStripeTransferId(String stripeTransferId);

        // Get total withdrawn amount by user
        @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdraw w WHERE w.user.id = :userId AND w.status = :status")
        BigDecimal getTotalWithdrawnByUserAndStatus(@Param("userId") UUID userId,
                        @Param("status") Withdraw.WithdrawStatus status);

        // Get total withdrawn amount by user (completed only)
        @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdraw w WHERE w.user.id = :userId AND w.status = 'COMPLETED'")
        BigDecimal getTotalWithdrawnByUser(@Param("userId") UUID userId);

        // Get pending withdrawal amount by user
        @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdraw w WHERE w.user.id = :userId AND w.status IN ('PENDING', 'PROCESSING')")
        BigDecimal getPendingWithdrawalAmountByUser(@Param("userId") UUID userId);

        // Count withdrawals by user and status
        long countByUserAndStatus(User user, Withdraw.WithdrawStatus status);

        // Find withdrawals within date range
        @Query("SELECT w FROM Withdraw w WHERE w.createdAt BETWEEN :startDate AND :endDate ORDER BY w.createdAt DESC")
        List<Withdraw> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);

        // Find withdrawals by user within date range
        @Query("SELECT w FROM Withdraw w WHERE w.user.id = :userId AND w.createdAt BETWEEN :startDate AND :endDate ORDER BY w.createdAt DESC")
        List<Withdraw> findByUserIdAndCreatedAtBetween(@Param("userId") UUID userId,
                        @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

        // Check if user has any pending withdrawals
        boolean existsByUserAndStatusIn(User user, List<Withdraw.WithdrawStatus> statuses);

        // Find recent withdrawals for admin dashboard
        @Query("SELECT w FROM Withdraw w ORDER BY w.createdAt DESC")
        Page<Withdraw> findRecentWithdrawals(Pageable pageable);

        // Count withdrawals by status and date range
        long countByStatusAndCreatedAtBetween(Withdraw.WithdrawStatus status, LocalDateTime startDate,
                        LocalDateTime endDate);

        // Get total amount by date range
        @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdraw w WHERE w.createdAt BETWEEN :startDate AND :endDate")
        BigDecimal getTotalAmountByDateRange(@Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);

        // Check if user has pending withdrawals by user ID and status
        boolean existsByUserIdAndStatus(UUID userId, Withdraw.WithdrawStatus status);

        // Count withdrawals by date range
        long countByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

        // Find withdrawal by ID and user ID
        @Query("SELECT w FROM Withdraw w WHERE w.id = :id AND w.user.id = :userId")
        Withdraw findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

        // Find all withdrawals ordered by creation date (for admin)
        Page<Withdraw> findAllByOrderByCreatedAtDesc(Pageable pageable);

        // Get total pending amount by user ID
        @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdraw w WHERE w.user.id = :userId AND w.status IN ('PENDING', 'PROCESSING')")
        BigDecimal getTotalPendingAmountByUserId(@Param("userId") UUID userId);

        // Find pending withdrawals older than specified time for automatic processing
        @Query("SELECT w FROM Withdraw w WHERE w.status = 'PENDING' AND w.createdAt < :cutoffTime ORDER BY w.createdAt ASC")
        List<Withdraw> findPendingWithdrawalsOlderThan(@Param("cutoffTime") LocalDateTime cutoffTime, Pageable pageable);

        // Find processing withdrawals with transfer IDs
        List<Withdraw> findByStatusAndStripeTransferIdIsNotNull(Withdraw.WithdrawStatus status);

        // Find old completed/failed withdrawals for cleanup
        @Query("SELECT w FROM Withdraw w WHERE w.status IN ('COMPLETED', 'FAILED') AND w.createdAt < :cutoffDate ORDER BY w.createdAt ASC")
        List<Withdraw> findOldCompletedWithdrawals(@Param("cutoffDate") LocalDateTime cutoffDate);

        // Count auto-processed withdrawals in last 24 hours (assuming we track this)
        @Query("SELECT COUNT(w) FROM Withdraw w WHERE w.status IN ('COMPLETED', 'PROCESSING') AND w.createdAt > :since")
        long countAutoProcessedWithdrawals(@Param("since") LocalDateTime since);

        // Count withdrawals by status
        long countByStatus(Withdraw.WithdrawStatus status);
}