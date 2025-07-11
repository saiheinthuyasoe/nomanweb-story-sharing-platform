package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.StoryView;
import com.app.nomanweb_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryViewRepository extends JpaRepository<StoryView, UUID> {

    // Find view record by user and story
    Optional<StoryView> findByUserAndStory(User user, Story story);

    // Find view record by user ID and story ID
    Optional<StoryView> findByUserIdAndStoryId(UUID userId, UUID storyId);

    // Check if user has viewed story
    boolean existsByUserIdAndStoryId(UUID userId, UUID storyId);

    // Count total views for a story
    @Query("SELECT COALESCE(SUM(sv.viewCount), 0) FROM StoryView sv WHERE sv.story.id = :storyId")
    Long countTotalViewsByStoryId(@Param("storyId") UUID storyId);

    // Count views in a date range for a story
    @Query("SELECT COALESCE(SUM(sv.viewCount), 0) FROM StoryView sv WHERE sv.story.id = :storyId AND sv.lastViewedAt >= :startDate AND sv.lastViewedAt <= :endDate")
    Long countViewsByStoryIdAndDateRange(@Param("storyId") UUID storyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Delete all views for a story (when story is deleted)
    void deleteByStoryId(UUID storyId);
}