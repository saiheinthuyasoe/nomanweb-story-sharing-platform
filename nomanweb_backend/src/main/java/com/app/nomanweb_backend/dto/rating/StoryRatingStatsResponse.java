package com.app.nomanweb_backend.dto.rating;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoryRatingStatsResponse {

    private UUID storyId;
    private Double averageRating;
    private Long totalRatings;
    private Map<Integer, Long> ratingDistribution; // rating value -> count
    private Integer userRating; // Current user's rating, null if not rated
}