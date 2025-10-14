package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.Story;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, UUID> {

        // Find chapters by story ordered by chapter number (excluding deleted) -
        // Optimized with JOIN FETCH
        @Query("SELECT c FROM Chapter c JOIN FETCH c.story WHERE c.story = :story AND (c.isDeleted = false OR c.isDeleted IS NULL) ORDER BY c.chapterNumber ASC")
        List<Chapter> findByStoryOrderByChapterNumberAsc(@Param("story") Story story);

        // Find chapters by story with pagination (excluding deleted) - Optimized with
        // JOIN FETCH
        @Query("SELECT c FROM Chapter c JOIN FETCH c.story WHERE c.story = :story AND (c.isDeleted = false OR c.isDeleted IS NULL) ORDER BY c.chapterNumber ASC")
        Page<Chapter> findByStoryOrderByChapterNumberAsc(@Param("story") Story story, Pageable pageable);

        // Find specific chapter by story and chapter number (excluding deleted) -
        // Optimized with JOIN FETCH
        @Query("SELECT c FROM Chapter c JOIN FETCH c.story WHERE c.story = :story AND c.chapterNumber = :chapterNumber AND (c.isDeleted = false OR c.isDeleted IS NULL)")
        Optional<Chapter> findByStoryAndChapterNumber(@Param("story") Story story,
                        @Param("chapterNumber") Integer chapterNumber);

        // Find chapters by story and status (excluding deleted) - Optimized with JOIN
        // FETCH
        @Query("SELECT c FROM Chapter c JOIN FETCH c.story WHERE c.story = :story AND c.status = :status AND (c.isDeleted = false OR c.isDeleted IS NULL)")
        List<Chapter> findByStoryAndStatus(@Param("story") Story story, @Param("status") Chapter.Status status);

        // Find published chapters by story (excluding deleted) - Optimized with JOIN
        // FETCH
        @Query("SELECT c FROM Chapter c JOIN FETCH c.story WHERE c.story = :story AND c.status = :status AND (c.isDeleted = false OR c.isDeleted IS NULL) ORDER BY c.chapterNumber ASC")
        List<Chapter> findByStoryAndStatusOrderByChapterNumberAsc(@Param("story") Story story,
                        @Param("status") Chapter.Status status);

        // Count chapters by story (excluding deleted)
        @Query("SELECT COUNT(c) FROM Chapter c WHERE c.story = :story AND (c.isDeleted = false OR c.isDeleted IS NULL)")
        long countByStory(@Param("story") Story story);

        // Count published chapters by story (excluding deleted)
        @Query("SELECT COUNT(c) FROM Chapter c WHERE c.story = :story AND c.status = :status AND (c.isDeleted = false OR c.isDeleted IS NULL)")
        long countByStoryAndStatus(@Param("story") Story story, @Param("status") Chapter.Status status);

        // Find next chapter (excluding deleted)
        @Query("SELECT c FROM Chapter c WHERE c.story = :story AND c.chapterNumber > :currentNumber AND c.status = :status AND (c.isDeleted = false OR c.isDeleted IS NULL) ORDER BY c.chapterNumber ASC LIMIT 1")
        Optional<Chapter> findNextChapter(@Param("story") Story story,
                        @Param("currentNumber") Integer currentNumber,
                        @Param("status") Chapter.Status status);

        // Find previous chapter (excluding deleted)
        @Query("SELECT c FROM Chapter c WHERE c.story = :story AND c.chapterNumber < :currentNumber AND c.status = :status AND (c.isDeleted = false OR c.isDeleted IS NULL) ORDER BY c.chapterNumber DESC LIMIT 1")
        Optional<Chapter> findPreviousChapter(@Param("story") Story story,
                        @Param("currentNumber") Integer currentNumber,
                        @Param("status") Chapter.Status status);

        // Find first chapter of a story (excluding deleted)
        @Query("SELECT c FROM Chapter c WHERE c.story = :story AND c.status = :status AND (c.isDeleted = false OR c.isDeleted IS NULL) ORDER BY c.chapterNumber ASC LIMIT 1")
        Optional<Chapter> findFirstByStoryAndStatusOrderByChapterNumberAsc(@Param("story") Story story,
                        @Param("status") Chapter.Status status);

        // Find last chapter of a story (excluding deleted)
        @Query("SELECT c FROM Chapter c WHERE c.story = :story AND c.status = :status AND (c.isDeleted = false OR c.isDeleted IS NULL) ORDER BY c.chapterNumber DESC LIMIT 1")
        Optional<Chapter> findFirstByStoryAndStatusOrderByChapterNumberDesc(@Param("story") Story story,
                        @Param("status") Chapter.Status status);

        // Find chapters by moderation status
        Page<Chapter> findByModerationStatus(Chapter.ModerationStatus moderationStatus, Pageable pageable);

        // Find chapters by moderation status ordered by creation date
        List<Chapter> findByModerationStatusOrderByCreatedAtAsc(Chapter.ModerationStatus moderationStatus);

        // Find chapters by moderation status with story and author eagerly fetched
        @Query("SELECT c FROM Chapter c JOIN FETCH c.story s JOIN FETCH s.author WHERE c.moderationStatus = :moderationStatus ORDER BY c.createdAt ASC")
        List<Chapter> findByModerationStatusWithStoryAndAuthor(
                        @Param("moderationStatus") Chapter.ModerationStatus moderationStatus);

        // Find chapter by ID with story and author eagerly fetched (for moderation
        // notifications)
        @Query("SELECT c FROM Chapter c JOIN FETCH c.story s JOIN FETCH s.author WHERE c.id = :id")
        Optional<Chapter> findByIdWithStoryAndAuthor(@Param("id") UUID id);

        // Find all chapters with non-null moderation status (for admin moderation page)
        @Query("SELECT c FROM Chapter c WHERE c.moderationStatus IS NOT NULL AND (c.isDeleted = false OR c.isDeleted IS NULL) ORDER BY c.createdAt DESC")
        Page<Chapter> findChaptersWithModerationStatus(Pageable pageable);

        // Check if chapter number exists for story
        boolean existsByStoryAndChapterNumber(Story story, Integer chapterNumber);

        // Get max chapter number for story
        @Query("SELECT MAX(c.chapterNumber) FROM Chapter c WHERE c.story = :story")
        Optional<Integer> findMaxChapterNumberByStory(@Param("story") Story story);

        // Search chapters by title or content
        @Query("SELECT c FROM Chapter c WHERE c.story = :story AND c.status = :status AND " +
                        "(LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                        "LOWER(c.content) LIKE LOWER(CONCAT('%', :query, '%')))")
        List<Chapter> searchByTitleOrContent(@Param("story") Story story,
                        @Param("query") String query,
                        @Param("status") Chapter.Status status);

        // Count chapters by story ID and status
        long countByStoryIdAndStatus(UUID storyId, Chapter.Status status);

        // Count chapters by moderation status
        long countByModerationStatus(Chapter.ModerationStatus moderationStatus);

        // Count chapters by moderation status and updated after a specific date
        long countByModerationStatusAndUpdatedAtAfter(Chapter.ModerationStatus moderationStatus, LocalDateTime date);

        // Count chapters created after a specific date
        long countByCreatedAtAfter(LocalDateTime date);

        // Trash-related queries

        // Find chapters in trash by story
        @Query("SELECT c FROM Chapter c WHERE c.story = :story AND c.isDeleted = true ORDER BY c.deletedAt DESC")
        List<Chapter> findTrashByStory(@Param("story") Story story);

        // Find all chapters by story including deleted (for author management)
        @Query("SELECT c FROM Chapter c WHERE c.story = :story ORDER BY c.isDeleted ASC, c.chapterNumber ASC")
        List<Chapter> findAllByStoryIncludingDeleted(@Param("story") Story story);

        // Count chapters in trash by story
        @Query("SELECT COUNT(c) FROM Chapter c WHERE c.story = :story AND c.isDeleted = true")
        long countTrashByStory(@Param("story") Story story);

        // Find chapters in trash older than specified date (for cleanup)
        @Query("SELECT c FROM Chapter c WHERE c.isDeleted = true AND c.deletedAt < :cutoffDate")
        List<Chapter> findTrashOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

        // Count non-deleted chapters by story and chapter number
        @Query("SELECT COUNT(c) FROM Chapter c WHERE c.story = :story AND c.chapterNumber = :chapterNumber AND c.isDeleted = false")
        long countByStoryAndChapterNumberAndNotDeleted(@Param("story") Story story,
                        @Param("chapterNumber") Integer chapterNumber);

        // Count non-deleted chapters by story and chapter number, excluding a specific
        // chapter (for updates)
        @Query("SELECT COUNT(c) FROM Chapter c WHERE c.story = :story AND c.chapterNumber = :chapterNumber AND c.isDeleted = false AND c.id != :excludeChapterId")
        long countByStoryAndChapterNumberAndNotDeletedExcluding(@Param("story") Story story,
                        @Param("chapterNumber") Integer chapterNumber,
                        @Param("excludeChapterId") UUID excludeChapterId);

        // Find chapters with views greater than specified value
        List<Chapter> findByViewsGreaterThan(Long views);

        // Count chapters by story, status, and created before a specific date
        @Query("SELECT COUNT(c) FROM Chapter c WHERE c.story = :story AND c.status = :status AND c.createdAt <= :date AND (c.isDeleted = false OR c.isDeleted IS NULL)")
        long countByStoryAndStatusAndCreatedAtBefore(@Param("story") Story story,
                        @Param("status") Chapter.Status status,
                        @Param("date") LocalDateTime date);

        // Feedback-related queries for admin management

        // Find all chapters with writer feedback (for admin feedback management)
        @Query("SELECT c FROM Chapter c JOIN FETCH c.story s JOIN FETCH s.author WHERE c.writerFeedback IS NOT NULL AND (c.isDeleted = false OR c.isDeleted IS NULL) ORDER BY c.feedbackSubmittedAt DESC")
        Page<Chapter> findByWriterFeedbackIsNotNull(Pageable pageable);

        // Find chapters with feedback by moderation status
        @Query("SELECT c FROM Chapter c JOIN FETCH c.story s JOIN FETCH s.author WHERE c.writerFeedback IS NOT NULL AND c.moderationStatus = :moderationStatus AND (c.isDeleted = false OR c.isDeleted IS NULL) ORDER BY c.feedbackSubmittedAt DESC")
        Page<Chapter> findByWriterFeedbackIsNotNullAndModerationStatus(
                        @Param("moderationStatus") Chapter.ModerationStatus moderationStatus, Pageable pageable);

        // Find chapters with feedback by multiple moderation statuses
        @Query("SELECT c FROM Chapter c JOIN FETCH c.story s JOIN FETCH s.author WHERE c.writerFeedback IS NOT NULL AND c.moderationStatus IN :moderationStatuses AND (c.isDeleted = false OR c.isDeleted IS NULL) ORDER BY c.feedbackSubmittedAt DESC")
        Page<Chapter> findByWriterFeedbackIsNotNullAndModerationStatusIn(
                        @Param("moderationStatuses") List<Chapter.ModerationStatus> moderationStatuses,
                        Pageable pageable);
}