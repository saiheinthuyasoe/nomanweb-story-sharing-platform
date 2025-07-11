package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.ChapterView;
import com.app.nomanweb_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChapterViewRepository extends JpaRepository<ChapterView, UUID> {

    // Find view record by user and chapter
    Optional<ChapterView> findByUserAndChapter(User user, Chapter chapter);

    // Find view record by user ID and chapter ID
    Optional<ChapterView> findByUserIdAndChapterId(UUID userId, UUID chapterId);

    // Check if user has viewed chapter
    boolean existsByUserIdAndChapterId(UUID userId, UUID chapterId);

    // Count total views for a chapter
    @Query("SELECT COALESCE(SUM(cv.viewCount), 0) FROM ChapterView cv WHERE cv.chapter.id = :chapterId")
    Long countTotalViewsByChapterId(@Param("chapterId") UUID chapterId);

    // Count total views for a story (sum of all chapter views)
    @Query("SELECT COALESCE(SUM(cv.viewCount), 0) FROM ChapterView cv WHERE cv.chapter.story.id = :storyId")
    Long countTotalViewsByStoryId(@Param("storyId") UUID storyId);

    // Count views in a date range for a chapter
    @Query("SELECT COALESCE(SUM(cv.viewCount), 0) FROM ChapterView cv WHERE cv.chapter.id = :chapterId AND cv.lastViewedAt >= :startDate AND cv.lastViewedAt <= :endDate")
    Long countViewsByChapterIdAndDateRange(@Param("chapterId") UUID chapterId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Count views in a date range for a story
    @Query("SELECT COALESCE(SUM(cv.viewCount), 0) FROM ChapterView cv WHERE cv.chapter.story.id = :storyId AND cv.lastViewedAt >= :startDate AND cv.lastViewedAt <= :endDate")
    Long countViewsByStoryIdAndDateRange(@Param("storyId") UUID storyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Delete all views for a chapter (when chapter is deleted)
    void deleteByChapterId(UUID chapterId);

    // Delete all views for a story (when story is deleted)
    void deleteByChapterStoryId(UUID storyId);
}