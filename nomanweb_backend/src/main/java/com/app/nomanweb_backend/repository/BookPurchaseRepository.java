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
}