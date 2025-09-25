package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.rating.StoryRatingResponse;
import com.app.nomanweb_backend.dto.rating.StoryRatingStatsResponse;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.StoryRating;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.StoryRatingRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.service.StoryRatingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StoryRatingServiceImpl implements StoryRatingService {

    private final StoryRatingRepository storyRatingRepository;
    private final UserRepository userRepository;
    private final StoryRepository storyRepository;

    @Override
    @Transactional
    public StoryRating rateStory(UUID userId, UUID storyId, Integer rating) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new IllegalArgumentException("Story not found"));

        // Check if user already rated this story
        if (storyRatingRepository.existsByUserIdAndStoryId(userId, storyId)) {
            throw new IllegalArgumentException("User has already rated this story. Use update instead.");
        }

        // Check if user can rate their own story (optional business rule)
        if (story.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("Authors cannot rate their own stories");
        }

        StoryRating storyRating = StoryRating.builder()
                .user(user)
                .story(story)
                .rating(rating)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        StoryRating savedRating = storyRatingRepository.save(storyRating);
        log.info("User {} rated story {} with {} stars", userId, storyId, rating);
        
        return savedRating;
    }

    @Override
    @Transactional
    public StoryRating updateRating(UUID userId, UUID storyId, Integer rating) {
        StoryRating existingRating = storyRatingRepository.findByUserIdAndStoryId(userId, storyId)
                .orElseThrow(() -> new IllegalArgumentException("Rating not found"));

        existingRating.setRating(rating);
        existingRating.setUpdatedAt(LocalDateTime.now());

        StoryRating updatedRating = storyRatingRepository.save(existingRating);
        log.info("User {} updated rating for story {} to {} stars", userId, storyId, rating);
        
        return updatedRating;
    }

    @Override
    @Transactional
    public void deleteRating(UUID userId, UUID storyId) {
        if (!storyRatingRepository.existsByUserIdAndStoryId(userId, storyId)) {
            throw new IllegalArgumentException("Rating not found");
        }

        storyRatingRepository.deleteByUserIdAndStoryId(userId, storyId);
        log.info("User {} deleted rating for story {}", userId, storyId);
    }

    @Override
    public StoryRating getUserRating(UUID userId, UUID storyId) {
        return storyRatingRepository.findByUserIdAndStoryId(userId, storyId)
                .orElse(null);
    }

    @Override
    public StoryRatingStatsResponse getStoryRatingStats(UUID storyId, UUID currentUserId) {
        // Verify story exists
        storyRepository.findById(storyId)
                .orElseThrow(() -> new IllegalArgumentException("Story not found"));

        Double averageRating = storyRatingRepository.getAverageRatingByStoryId(storyId);
        Long totalRatings = storyRatingRepository.countByStoryId(storyId);
        
        // Get rating distribution
        List<Object[]> distributionData = storyRatingRepository.getRatingDistributionByStoryId(storyId);
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        
        // Initialize all ratings (1-5) with 0 count
        for (int i = 1; i <= 5; i++) {
            ratingDistribution.put(i, 0L);
        }
        
        // Fill in actual counts
        for (Object[] data : distributionData) {
            Integer rating = (Integer) data[0];
            Long count = (Long) data[1];
            ratingDistribution.put(rating, count);
        }

        // Get current user's rating if provided
        Integer userRating = null;
        if (currentUserId != null) {
            StoryRating userStoryRating = getUserRating(currentUserId, storyId);
            if (userStoryRating != null) {
                userRating = userStoryRating.getRating();
            }
        }

        return StoryRatingStatsResponse.builder()
                .storyId(storyId)
                .averageRating(averageRating)
                .totalRatings(totalRatings)
                .ratingDistribution(ratingDistribution)
                .userRating(userRating)
                .build();
    }

    @Override
    public Double getAverageRating(UUID storyId) {
        return storyRatingRepository.getAverageRatingByStoryId(storyId);
    }

    @Override
    public Long getTotalRatings(UUID storyId) {
        return storyRatingRepository.countByStoryId(storyId);
    }

    @Override
    public Page<StoryRatingResponse> getStoryRatings(UUID storyId, Pageable pageable) {
        Page<StoryRating> ratingsPage = storyRatingRepository.findByStoryId(storyId)
                .stream()
                .skip(pageable.getOffset())
                .limit(pageable.getPageSize())
                .collect(Collectors.collectingAndThen(
                        Collectors.toList(),
                        list -> new PageImpl<>(list, pageable, storyRatingRepository.countByStoryId(storyId))
                ));

        List<StoryRatingResponse> responses = ratingsPage.getContent().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, ratingsPage.getTotalElements());
    }

    @Override
    public List<StoryRatingResponse> getUserRatings(UUID userId) {
        List<StoryRating> ratings = storyRatingRepository.findByUserId(userId);
        return ratings.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public boolean hasUserRated(UUID userId, UUID storyId) {
        return storyRatingRepository.existsByUserIdAndStoryId(userId, storyId);
    }

    @Override
    public boolean canUserRate(UUID userId, UUID storyId) {
        // Check if story exists
        Story story = storyRepository.findById(storyId).orElse(null);
        if (story == null) {
            return false;
        }

        // Check if user is the author (authors can't rate their own stories)
        if (story.getAuthor().getId().equals(userId)) {
            return false;
        }

        // Check if user already rated
        return !hasUserRated(userId, storyId);
    }

    private StoryRatingResponse convertToResponse(StoryRating rating) {
        return StoryRatingResponse.builder()
                .id(rating.getId())
                .userId(rating.getUser().getId())
                .username(rating.getUser().getUsername())
                .storyId(rating.getStory().getId())
                .rating(rating.getRating())
                .createdAt(rating.getCreatedAt())
                .updatedAt(rating.getUpdatedAt())
                .build();
    }
}