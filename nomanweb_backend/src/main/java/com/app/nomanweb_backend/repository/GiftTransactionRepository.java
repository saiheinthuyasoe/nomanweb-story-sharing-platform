package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.GiftTransaction;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.Chapter;
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
public interface GiftTransactionRepository extends JpaRepository<GiftTransaction, UUID> {

    // Find gifts received by a user
    Page<GiftTransaction> findByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);

    // Find gifts sent by a user
    Page<GiftTransaction> findBySenderOrderByCreatedAtDesc(User sender, Pageable pageable);

    // Find gifts for a specific story
    List<GiftTransaction> findByStoryOrderByCreatedAtDesc(Story story);

    // Find gifts for a specific chapter
    List<GiftTransaction> findByChapterOrderByCreatedAtDesc(Chapter chapter);

    // Calculate total earnings for a recipient
    @Query("SELECT COALESCE(SUM(gt.totalCoins), 0) FROM GiftTransaction gt WHERE gt.recipient.id = :recipientId")
    BigDecimal calculateTotalEarningsForRecipient(@Param("recipientId") UUID recipientId);

    // Calculate total earnings for a recipient in date range
    @Query("SELECT COALESCE(SUM(gt.totalCoins), 0) FROM GiftTransaction gt WHERE gt.recipient.id = :recipientId AND gt.createdAt BETWEEN :startDate AND :endDate")
    BigDecimal calculateEarningsForPeriod(@Param("recipientId") UUID recipientId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Find recent gift transactions for analytics
    @Query("SELECT gt FROM GiftTransaction gt WHERE gt.createdAt >= :since ORDER BY gt.createdAt DESC")
    List<GiftTransaction> findRecentGifts(@Param("since") LocalDateTime since);

    // Top gifted stories
    @Query("SELECT gt.story, SUM(gt.totalCoins) as totalValue FROM GiftTransaction gt WHERE gt.story IS NOT NULL GROUP BY gt.story ORDER BY totalValue DESC")
    List<Object[]> findTopGiftedStories(Pageable pageable);
}