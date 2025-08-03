package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.ChapterRefund;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChapterRefundRepository extends JpaRepository<ChapterRefund, UUID> {

    /**
     * Find all chapter refunds for a specific user and chapter.
     * Used to check if a user has received a refund for a specific chapter.
     */
    List<ChapterRefund> findByUserAndChapter(User user, Chapter chapter);

    /**
     * Find all chapter refunds for a specific user and story.
     * Used to check which chapters a user has received refunds for in a story.
     */
    List<ChapterRefund> findByUserAndStory(User user, Story story);

    /**
     * Find all chapter refunds for a specific chapter.
     * Used when processing refunds for a chapter unpublish.
     */
    List<ChapterRefund> findByChapter(Chapter chapter);

    /**
     * Check if a user has received a refund for a specific chapter.
     */
    boolean existsByUserAndChapter(User user, Chapter chapter);

    /**
     * Find all users who received refunds for a specific chapter.
     * Used to grant access when a chapter is republished.
     */
    @Query("SELECT DISTINCT cr.user FROM ChapterRefund cr WHERE cr.chapter = :chapter")
    List<User> findUsersWithRefundsForChapter(@Param("chapter") Chapter chapter);

    /**
     * Find all chapter refunds for chapters in a specific story.
     * Used for story-level operations.
     */
    List<ChapterRefund> findByStory(Story story);

    /**
     * Find all chapter refunds associated with a specific book purchase.
     * Used to calculate net refunds when a whole book is unpublished.
     */
    List<ChapterRefund> findByBookPurchase(com.app.nomanweb_backend.entity.BookPurchase bookPurchase);

    /**
     * Delete all chapter refunds for a specific chapter.
     * Used when a chapter is permanently deleted.
     * @return 
     */
    @Modifying
    @Transactional
    long deleteByChapter(Chapter chapter);

    /**
     * Delete all chapter refunds for a specific story.
     * Used when a story is permanently deleted.
     */
    void deleteByStory(Story story);
}