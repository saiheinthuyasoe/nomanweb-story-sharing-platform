package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.ReadingProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReadingProgressRepository extends JpaRepository<ReadingProgress, UUID> {

        // Find by user and chapter
        Optional<ReadingProgress> findByUserIdAndChapterId(UUID userId, UUID chapterId);

        // Find by user, story and chapter
        Optional<ReadingProgress> findByUserIdAndStoryIdAndChapterId(UUID userId, UUID storyId, UUID chapterId);

        // Find by user and story
        List<ReadingProgress> findByUserIdAndStoryIdOrderByLastReadAtDesc(UUID userId, UUID storyId);

        // Find by user
        List<ReadingProgress> findByUserIdOrderByLastReadAtDesc(UUID userId);

        // Find latest progress by user for each story
        @Query("SELECT rp FROM ReadingProgress rp WHERE rp.user.id = :userId " +
                        "AND rp.lastReadAt = (SELECT MAX(rp2.lastReadAt) FROM ReadingProgress rp2 " +
                        "WHERE rp2.user.id = :userId AND rp2.story.id = rp.story.id) " +
                        "ORDER BY rp.lastReadAt DESC")
        List<ReadingProgress> findLatestProgressByUserOrderByLastReadAtDesc(@Param("userId") UUID userId);

        // Check if user has progress on story
        boolean existsByUserIdAndStoryId(UUID userId, UUID storyId);

        // Count completed chapters by user and story
        @Query("SELECT COUNT(rp) FROM ReadingProgress rp WHERE rp.user.id = :userId " +
                        "AND rp.story.id = :storyId AND rp.progressPercentage >= 100")
        long countCompletedChaptersByUserAndStory(@Param("userId") UUID userId, @Param("storyId") UUID storyId);

        // Count completed books by user (stories with at least one completed chapter)
        @Query("SELECT COUNT(DISTINCT rp.story.id) FROM ReadingProgress rp WHERE rp.user.id = :userId " +
                        "AND rp.progressPercentage >= 100")
        long countCompletedBooksByUser(@Param("userId") UUID userId);

        // Find by story
        List<ReadingProgress> findByStoryId(UUID storyId);
}