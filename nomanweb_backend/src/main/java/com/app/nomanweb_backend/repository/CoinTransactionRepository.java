package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.CoinTransaction;
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
public interface CoinTransactionRepository extends JpaRepository<CoinTransaction, UUID> {

    // Find transactions by user
    Page<CoinTransaction> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    // Find transactions by user and type
    List<CoinTransaction> findByUserAndTransactionType(User user, CoinTransaction.TransactionType transactionType);

    // Find transactions by reference
    List<CoinTransaction> findByReferenceTypeAndReferenceId(CoinTransaction.ReferenceType referenceType,
            UUID referenceId);

    // Check if user has purchased specific item
    boolean existsByUserIdAndReferenceIdAndReferenceTypeAndTransactionTypeAndStatus(
            UUID userId,
            UUID referenceId,
            CoinTransaction.ReferenceType referenceType,
            CoinTransaction.TransactionType transactionType,
            CoinTransaction.Status status);

    // Get user's total earnings
    @Query("SELECT COALESCE(SUM(ct.amount), 0) FROM CoinTransaction ct WHERE ct.user.id = :userId AND ct.transactionType = :transactionType AND ct.status = :status")
    BigDecimal getTotalAmountByUserAndType(@Param("userId") UUID userId,
            @Param("transactionType") CoinTransaction.TransactionType transactionType,
            @Param("status") CoinTransaction.Status status);

    // Get transactions in date range
    @Query("SELECT ct FROM CoinTransaction ct WHERE ct.user = :user AND ct.createdAt BETWEEN :startDate AND :endDate ORDER BY ct.createdAt DESC")
    List<CoinTransaction> findByUserAndDateRange(@Param("user") User user,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Get recent transactions
    List<CoinTransaction> findTop10ByUserOrderByCreatedAtDesc(User user);

    // Find transactions by status
    Page<CoinTransaction> findByStatus(CoinTransaction.Status status, Pageable pageable);

    // Get user's coin balance history
    @Query("SELECT ct FROM CoinTransaction ct WHERE ct.user = :user ORDER BY ct.createdAt ASC")
    List<CoinTransaction> findUserTransactionHistory(@Param("user") User user);
}