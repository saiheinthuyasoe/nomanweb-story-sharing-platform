package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.ChapterPurchase;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.Story;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChapterPurchaseRepository extends JpaRepository<ChapterPurchase, UUID> {

    // Check if user has purchased a specific chapter
    boolean existsByUserAndChapter(User user, Chapter chapter);

    Optional<ChapterPurchase> findByUserAndChapter(User user, Chapter chapter);

    // Find all purchases by a user
    Page<ChapterPurchase> findByUserOrderByPurchasedAtDesc(User user, Pageable pageable);

    // Find all purchases for a story
    List<ChapterPurchase> findByStoryOrderByPurchasedAtDesc(Story story);

    // Find all purchases for a chapter
    List<ChapterPurchase> findByChapterOrderByPurchasedAtDesc(Chapter chapter);

    // Calculate total earnings for a story author
    @Query("SELECT COALESCE(SUM(cp.coinsSpent * 0.7), 0) FROM ChapterPurchase cp WHERE cp.story.author.id = :authorId")
    BigDecimal calculateTotalEarningsForAuthor(@Param("authorId") UUID authorId);

    // Calculate earnings for author in date range
    @Query("SELECT COALESCE(SUM(cp.coinsSpent * 0.7), 0) FROM ChapterPurchase cp WHERE cp.story.author.id = :authorId AND cp.purchasedAt BETWEEN :startDate AND :endDate")
    BigDecimal calculateEarningsForPeriod(@Param("authorId") UUID authorId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Count purchases for a chapter
    @Query("SELECT COUNT(cp) FROM ChapterPurchase cp WHERE cp.chapter.id = :chapterId")
    long countPurchasesForChapter(@Param("chapterId") UUID chapterId);

    // Revenue analytics
    @Query("SELECT DATE(cp.purchasedAt), SUM(cp.coinsSpent) FROM ChapterPurchase cp WHERE cp.purchasedAt >= :since GROUP BY DATE(cp.purchasedAt) ORDER BY DATE(cp.purchasedAt)")
    List<Object[]> getDailyRevenue(@Param("since") LocalDateTime since);

    // Top earning chapters
    @Query("SELECT cp.chapter, SUM(cp.coinsSpent) as totalRevenue FROM ChapterPurchase cp GROUP BY cp.chapter ORDER BY totalRevenue DESC")
    List<Object[]> findTopEarningChapters(Pageable pageable);

    // Find all chapter purchases by user for a specific story
    List<ChapterPurchase> findByUserAndStory(User user, Story story);

    // Find all active chapter purchases for a story (not refunded)
    @Query("SELECT cp FROM ChapterPurchase cp WHERE cp.story = :story AND cp.isRefunded = false ORDER BY cp.purchasedAt DESC")
    List<ChapterPurchase> findActiveByStoryOrderByPurchasedAtDesc(@Param("story") Story story);

    // Find all active chapter purchases for a chapter (not refunded)
    @Query("SELECT cp FROM ChapterPurchase cp WHERE cp.chapter = :chapter AND cp.isRefunded = false ORDER BY cp.purchasedAt DESC")
    List<ChapterPurchase> findActiveByChapterOrderByPurchasedAtDesc(@Param("chapter") Chapter chapter);
}