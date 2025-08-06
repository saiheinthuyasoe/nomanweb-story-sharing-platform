package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.StoryRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryRatingRepository extends JpaRepository<StoryRating, UUID> {

    Optional<StoryRating> findByUserIdAndStoryId(UUID userId, UUID storyId);

    boolean existsByUserIdAndStoryId(UUID userId, UUID storyId);

    List<StoryRating> findByStoryId(UUID storyId);

    List<StoryRating> findByUserId(UUID userId);

    @Query("SELECT COUNT(sr) FROM StoryRating sr WHERE sr.story.id = :storyId")
    long countByStoryId(@Param("storyId") UUID storyId);

    @Query("SELECT AVG(sr.rating) FROM StoryRating sr WHERE sr.story.id = :storyId")
    Double getAverageRatingByStoryId(@Param("storyId") UUID storyId);

    @Query("SELECT sr.rating, COUNT(sr) FROM StoryRating sr WHERE sr.story.id = :storyId GROUP BY sr.rating ORDER BY sr.rating")
    List<Object[]> getRatingDistributionByStoryId(@Param("storyId") UUID storyId);

    void deleteByUserIdAndStoryId(UUID userId, UUID storyId);
}