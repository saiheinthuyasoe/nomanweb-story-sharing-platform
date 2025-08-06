package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.rating.StoryRatingResponse;
import com.app.nomanweb_backend.dto.rating.StoryRatingStatsResponse;
import com.app.nomanweb_backend.entity.StoryRating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface StoryRatingService {

    // Basic rating operations
    StoryRating rateStory(UUID userId, UUID storyId, Integer rating);

    StoryRating updateRating(UUID userId, UUID storyId, Integer rating);

    void deleteRating(UUID userId, UUID storyId);

    StoryRating getUserRating(UUID userId, UUID storyId);

    // Rating statistics
    StoryRatingStatsResponse getStoryRatingStats(UUID storyId, UUID currentUserId);

    Double getAverageRating(UUID storyId);

    Long getTotalRatings(UUID storyId);

    // Rating listing
    Page<StoryRatingResponse> getStoryRatings(UUID storyId, Pageable pageable);

    List<StoryRatingResponse> getUserRatings(UUID userId);

    // Validation
    boolean hasUserRated(UUID userId, UUID storyId);

    boolean canUserRate(UUID userId, UUID storyId);
}