package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.Story;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, UUID> {

    // Find chapters by story ordered by chapter number
    List<Chapter> findByStoryOrderByChapterNumberAsc(Story story);

    // Find chapters by story with pagination
    Page<Chapter> findByStoryOrderByChapterNumberAsc(Story story, Pageable pageable);

    // Find specific chapter by story and chapter number
    Optional<Chapter> findByStoryAndChapterNumber(Story story, Integer chapterNumber);

    // Find chapters by story and status
    List<Chapter> findByStoryAndStatus(Story story, Chapter.Status status);

    // Find published chapters by story
    List<Chapter> findByStoryAndStatusOrderByChapterNumberAsc(Story story, Chapter.Status status);

    // Count chapters by story
    long countByStory(Story story);

    // Count published chapters by story
    long countByStoryAndStatus(Story story, Chapter.Status status);

    // Find next chapter
    @Query("SELECT c FROM Chapter c WHERE c.story = :story AND c.chapterNumber > :currentNumber AND c.status = :status ORDER BY c.chapterNumber ASC LIMIT 1")
    Optional<Chapter> findNextChapter(@Param("story") Story story,
            @Param("currentNumber") Integer currentNumber,
            @Param("status") Chapter.Status status);

    // Find previous chapter
    @Query("SELECT c FROM Chapter c WHERE c.story = :story AND c.chapterNumber < :currentNumber AND c.status = :status ORDER BY c.chapterNumber DESC LIMIT 1")
    Optional<Chapter> findPreviousChapter(@Param("story") Story story,
            @Param("currentNumber") Integer currentNumber,
            @Param("status") Chapter.Status status);

    // Find first chapter of a story
    Optional<Chapter> findFirstByStoryAndStatusOrderByChapterNumberAsc(Story story, Chapter.Status status);

    // Find last chapter of a story
    Optional<Chapter> findFirstByStoryAndStatusOrderByChapterNumberDesc(Story story, Chapter.Status status);

    // Find chapters by moderation status
    Page<Chapter> findByModerationStatus(Chapter.ModerationStatus moderationStatus, Pageable pageable);

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
}