package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.BookPurchase;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BookPurchaseRepository extends JpaRepository<BookPurchase, UUID> {

    // Check if user has purchased a specific book
    boolean existsByUserAndStory(User user, Story story);

    // Get all book purchases by user
    Page<BookPurchase> findByUserOrderByPurchasedAtDesc(User user, Pageable pageable);

    // Get all book purchases for a specific story
    Page<BookPurchase> findByStoryOrderByPurchasedAtDesc(Story story, Pageable pageable);

    // Get book purchases by user (for library)
    List<BookPurchase> findByUserOrderByPurchasedAtDesc(User user);

    // Get book purchase count for a story
    long countByStory(Story story);

    // Get total earnings for an author from book purchases
    @Query("SELECT COALESCE(SUM(bp.coinsSpent), 0) FROM BookPurchase bp WHERE bp.story.author.id = :authorId")
    java.math.BigDecimal getTotalEarningsForAuthor(@Param("authorId") UUID authorId);

    // Find book purchase by user and story
    java.util.Optional<BookPurchase> findByUserAndStory(User user, Story story);

    // Find the most recent book purchase by user and story (to handle multiple
    // purchases)
    @Query("SELECT bp FROM BookPurchase bp WHERE bp.user = :user AND bp.story = :story ORDER BY bp.purchasedAt DESC")
    List<BookPurchase> findByUserAndStoryOrderByPurchasedAtDesc(@Param("user") User user, @Param("story") Story story);

    // Find the most recent active book purchase by user and story
    @Query("SELECT bp FROM BookPurchase bp WHERE bp.user = :user AND bp.story = :story AND bp.isRefunded = false ORDER BY bp.purchasedAt DESC")
    List<BookPurchase> findActiveByUserAndStoryOrderByPurchasedAtDesc(@Param("user") User user,
            @Param("story") Story story);

    // Find all active book purchases for a story (not refunded)
    @Query("SELECT bp FROM BookPurchase bp WHERE bp.story = :story AND bp.isRefunded = false ORDER BY bp.purchasedAt DESC")
    List<BookPurchase> findActiveByStoryOrderByPurchasedAtDesc(@Param("story") Story story);

    // Find all active book purchases for a story (not refunded) - alternative
    // method name
    @Query("SELECT bp FROM BookPurchase bp WHERE bp.story = :story AND bp.isRefunded = false ORDER BY bp.purchasedAt DESC")
    List<BookPurchase> findByStoryAndIsRefundedFalseOrderByPurchasedAtDesc(@Param("story") Story story);

    // Find all refunded book purchases for a story
    @Query("SELECT bp FROM BookPurchase bp WHERE bp.story = :story AND bp.isRefunded = true ORDER BY bp.purchasedAt DESC")
    List<BookPurchase> findByStoryAndIsRefundedTrueOrderByPurchasedAtDesc(@Param("story") Story story);
}
