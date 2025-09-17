package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.FeaturedContent;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.Category;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class AutomaticBookSelectionService {

    private final StoryRepository storyRepository;
    private final CategoryRepository categoryRepository;

    /**
     * Get automatically selected stories for Best Rating section
     * Algorithm: Stories with highest likes-to-views ratio and minimum engagement
     */
    public Page<Story> getBestRatingStories(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        // Get published stories with minimum engagement (at least 10 views and 1 like)
        // Ordered by likes-to-views ratio descending, then by total likes descending
        return storyRepository.findBestRatedStories(Story.PublishStatus.PUBLISHED, pageable);
    }

    /**
     * Get automatically selected stories for Weekly Featured section
     * Algorithm: Stories with highest engagement in the last 7 days
     */
    public Page<Story> getWeeklyFeaturedStories(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        LocalDateTime weekAgo = LocalDateTime.now().minusWeeks(1);
        
        // Get stories with highest recent engagement (views + likes in last 7 days)
        return storyRepository.findWeeklyTrending(Story.PublishStatus.PUBLISHED, weekAgo, pageable);
    }

    /**
     * Get automatically selected stories for Best of All Time section
     * Algorithm: Stories with highest overall performance metrics
     */
    public Page<Story> getBestOfAllTimeStories(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        // Get stories with highest combined score of views, likes, and longevity
        // Weighted formula: (totalViews * 0.3) + (totalLikes * 0.5) + (ageBonus * 0.2)
        return storyRepository.findBestOfAllTime(Story.PublishStatus.PUBLISHED, pageable);
    }

    /**
     * Get automatically selected stories for Recommended for You section
     * Algorithm: Personalized recommendations based on user preferences
     * For now, returns popular stories from user's preferred categories
     */
    public Page<Story> getRecommendedStories(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        if (userId != null) {
            // Get user's reading history and preferred categories
            // For now, return popular stories from mixed categories
            Long minViews = 100L;
            return storyRepository.findRecommendedStories(Story.PublishStatus.PUBLISHED, minViews, pageable);
        } else {
            // For anonymous users, return trending stories
            return storyRepository.findTrendingStories(Story.PublishStatus.PUBLISHED, pageable);
        }
    }

    /**
     * Get automatically selected stories for Recommended for You section (without userId)
     * Algorithm: Returns trending stories for anonymous users
     */
    public Page<Story> getRecommendedStories(int page, int size) {
        return getRecommendedStories(null, page, size);
    }

    /**
     * Main method to get stories by section type
     * This method routes to appropriate algorithm based on section type
     */
    public Page<Story> getStoriesBySection(String sectionType, int page, int size) {
        switch (sectionType.toUpperCase()) {
            case "BEST_RATING":
                return getBestRatingStories(page, size);
            case "WEEKLY_FEATURES":
                return getWeeklyFeaturedStories(page, size);
            case "BEST_OF_ALL_TIME":
                return getBestOfAllTimeStories(page, size);
            case "RECOMMENDED_FOR_YOU":
                return getRecommendedStories(page, size);
            case "NEW_RELEASES":
                return getNewReleasesStories(page, size);
            case "CAROUSEL":
                return getCarouselStories(page, size);
            case "TRENDING":
                return getTrendingStories(page, size);
            case "EDITOR_CHOICE":
                return getEditorChoiceStories(page, size);
            default:
                // Default to trending stories
                return getTrendingStories(page, size);
        }
    }

    /**
     * Get automatically selected stories for New Releases section
     * Algorithm: Recently published stories with good initial engagement
     */
    public Page<Story> getNewReleasesStories(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        // Get stories published in last 30 days, ordered by publication date and engagement
        return storyRepository.findNewestStories(Story.PublishStatus.PUBLISHED, pageable);
    }

    /**
     * Get automatically selected stories by genre
     * Algorithm: Best performing stories in specific category
     */
    public Page<Story> getStoriesByGenre(String genreSlug, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        // Find category by slug
        Category category = categoryRepository.findBySlug(genreSlug)
            .orElse(null);
            
        if (category == null) {
            log.warn("Category not found for genre: {}", genreSlug);
            return Page.empty(pageable);
        }
        
        // Get best performing stories in this category
        return storyRepository.findByCategoryIdAndPublishStatus(category.getId(), Story.PublishStatus.PUBLISHED, pageable);
    }

    /**
     * Get automatically selected stories for Homepage Carousel
     * Algorithm: Mix of trending, highly rated, and recently popular stories
     */
    public Page<Story> getCarouselStories(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        // Get a curated mix of the best stories across different criteria
        return storyRepository.findFeaturedStories(Story.PublishStatus.PUBLISHED, pageable);
    }

    /**
     * Get stories by category ID
     */
    private Page<Story> getStoriesByCategory(UUID categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return storyRepository.findByCategoryIdAndPublishStatus(categoryId, Story.PublishStatus.PUBLISHED, pageable);
    }

    /**
     * Calculate story score for ranking algorithms
     * Combines multiple metrics into a single score
     */
    public double calculateStoryScore(Story story) {
        long views = story.getTotalViews() != null ? story.getTotalViews() : 0L;
        long likes = story.getTotalLikes() != null ? story.getTotalLikes() : 0L;
        
        // Avoid division by zero
        if (views == 0) {
            return likes > 0 ? 1.0 : 0.0;
        }
        
        // Calculate engagement ratio (likes per view)
        double engagementRatio = (double) likes / views;
        
        // Calculate recency bonus (newer stories get slight boost)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime createdAt = story.getCreatedAt();
        long daysOld = java.time.Duration.between(createdAt, now).toDays();
        double recencyBonus = Math.max(0, 1.0 - (daysOld / 365.0)); // Bonus decreases over a year
        
        // Combined score: engagement ratio (70%) + view count factor (20%) + recency bonus (10%)
        double viewFactor = Math.log10(Math.max(1, views)) / 10.0; // Logarithmic scaling for views
        
        return (engagementRatio * 0.7) + (viewFactor * 0.2) + (recencyBonus * 0.1);
    }

    /**
     * Get trending stories based on recent activity
     */
    public Page<Story> getTrendingStories(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        // Get stories with high recent engagement
        return storyRepository.findTrendingStories(Story.PublishStatus.PUBLISHED, pageable);
    }

    /**
     * Get editor's choice stories (high quality, well-written stories)
     * Algorithm: Stories with high engagement and good retention metrics
     */
    public Page<Story> getEditorChoiceStories(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        // Get stories with high quality indicators
        return storyRepository.findFeaturedStories(Story.PublishStatus.PUBLISHED, pageable);
    }
}