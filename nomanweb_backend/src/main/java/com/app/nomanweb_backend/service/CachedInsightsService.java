package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.Category;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.repository.CategoryRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CachedInsightsService {

    private final StoryRepository storyRepository;
    private final CategoryRepository categoryRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    // Cache keys
    private static final String TOP_RATED_CACHE_KEY = "admin:insights:top_rated";
    private static final String MOST_READ_WEEKLY_CACHE_KEY = "admin:insights:most_read_weekly";
    private static final String NEW_RELEASES_CACHE_KEY = "admin:insights:new_releases";
    private static final String BOOKS_BY_GENRE_CACHE_KEY = "admin:insights:books_by_genre";
    private static final String SUGGESTIONS_CACHE_KEY = "admin:insights:suggestions";

    // Cache TTL (Time To Live) in minutes
    private static final long TOP_RATED_TTL = 30; // 30 minutes
    private static final long MOST_READ_WEEKLY_TTL = 15; // 15 minutes (more dynamic)
    private static final long NEW_RELEASES_TTL = 60; // 1 hour
    private static final long BOOKS_BY_GENRE_TTL = 45; // 45 minutes
    private static final long SUGGESTIONS_TTL = 20; // 20 minutes

    @Cacheable(value = "admin_insights_top_rated", key = "#limit")
    public List<Map<String, Object>> getTopRatedBooksCached(int limit) {
        log.info("Fetching top-rated books from database with limit: {}", limit);

        try {
            Pageable pageable = PageRequest.of(0, limit);
            List<Story> stories = storyRepository.findBestRatedStories(
                    Story.PublishStatus.PUBLISHED, pageable).getContent();

            List<Map<String, Object>> insights = stories.stream()
                    .map(this::convertToBookInsight)
                    .collect(Collectors.toList());

            // Store in Redis with TTL
            String cacheKey = TOP_RATED_CACHE_KEY + ":" + limit;
            redisTemplate.opsForValue().set(cacheKey, insights, TOP_RATED_TTL, TimeUnit.MINUTES);

            log.info("Cached {} top-rated books for {} minutes", insights.size(), TOP_RATED_TTL);
            return insights;
        } catch (Exception e) {
            log.error("Error fetching top-rated books", e);
            throw e;
        }
    }

    @Cacheable(value = "admin_insights_most_read_weekly", key = "#limit")
    public List<Map<String, Object>> getMostReadWeeklyCached(int limit) {
        log.info("Fetching most read weekly books from database with limit: {}", limit);

        try {
            LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);
            Pageable pageable = PageRequest.of(0, limit);
            List<Story> stories = storyRepository.findWeeklyTrending(
                    Story.PublishStatus.PUBLISHED, oneWeekAgo, pageable).getContent();

            // If not enough from this week, get most viewed overall
            if (stories.size() < limit) {
                stories = storyRepository.findTrendingStories(
                        Story.PublishStatus.PUBLISHED, pageable).getContent();
            }

            List<Map<String, Object>> insights = stories.stream()
                    .map(this::convertToBookInsight)
                    .collect(Collectors.toList());

            // Store in Redis with TTL
            String cacheKey = MOST_READ_WEEKLY_CACHE_KEY + ":" + limit;
            redisTemplate.opsForValue().set(cacheKey, insights, MOST_READ_WEEKLY_TTL, TimeUnit.MINUTES);

            log.info("Cached {} most read weekly books for {} minutes", insights.size(), MOST_READ_WEEKLY_TTL);
            return insights;
        } catch (Exception e) {
            log.error("Error fetching most read weekly books", e);
            throw e;
        }
    }

    @Cacheable(value = "admin_insights_new_releases", key = "#limit")
    public List<Map<String, Object>> getNewReleasesCached(int limit) {
        log.info("Fetching new releases from database with limit: {}", limit);

        try {
            Pageable pageable = PageRequest.of(0, limit);
            List<Story> stories = storyRepository.findNewestStories(
                    Story.PublishStatus.PUBLISHED, pageable).getContent();

            List<Map<String, Object>> insights = stories.stream()
                    .map(this::convertToBookInsight)
                    .collect(Collectors.toList());

            // Store in Redis with TTL
            String cacheKey = NEW_RELEASES_CACHE_KEY + ":" + limit;
            redisTemplate.opsForValue().set(cacheKey, insights, NEW_RELEASES_TTL, TimeUnit.MINUTES);

            log.info("Cached {} new releases for {} minutes", insights.size(), NEW_RELEASES_TTL);
            return insights;
        } catch (Exception e) {
            log.error("Error fetching new releases", e);
            throw e;
        }
    }

    @Cacheable(value = "admin_insights_books_by_genre", key = "#genreId + '_' + #limit")
    public List<Map<String, Object>> getBooksByGenreCached(String genreId, int limit) {
        log.info("Fetching books by genre from database: {} with limit: {}", genreId, limit);

        try {
            // Map genre names to category names
            String categoryName = mapGenreToCategory(genreId);

            // Find category by name or slug
            Category category = categoryRepository.findByName(categoryName)
                    .or(() -> categoryRepository.findBySlug(genreId))
                    .orElse(null);

            if (category == null) {
                log.warn("Category not found for genre: {}", genreId);
                return List.of();
            }

            Pageable pageable = PageRequest.of(0, limit, Sort.by("totalViews").descending());
            List<Story> stories = storyRepository.findByCategoryIdAndPublishStatus(
                    category.getId(), Story.PublishStatus.PUBLISHED, pageable).getContent();

            List<Map<String, Object>> insights = stories.stream()
                    .map(this::convertToBookInsight)
                    .collect(Collectors.toList());

            // Store in Redis with TTL
            String cacheKey = BOOKS_BY_GENRE_CACHE_KEY + ":" + genreId + ":" + limit;
            redisTemplate.opsForValue().set(cacheKey, insights, BOOKS_BY_GENRE_TTL, TimeUnit.MINUTES);

            log.info("Cached {} books for genre {} for {} minutes", insights.size(), genreId, BOOKS_BY_GENRE_TTL);
            return insights;
        } catch (Exception e) {
            log.error("Error fetching books by genre: {}", genreId, e);
            throw e;
        }
    }

    @Cacheable(value = "admin_insights_suggestions", key = "#sectionType + '_' + #limit + '_' + #genre + '_' + #minRating + '_' + #minViews")
    public List<Map<String, Object>> getSuggestionsCached(String sectionType, int limit, String genre, Double minRating,
            Integer minViews) {
        log.info("Fetching suggestions from database for section: {} with limit: {}", sectionType, limit);

        try {
            List<Map<String, Object>> suggestions;

            switch (sectionType.toUpperCase()) {
                case "TOP_RATED":
                case "BEST_RATING":
                    suggestions = getTopRatedBooksCached(limit);
                    break;
                case "MOST_READ_WEEKLY":
                case "WEEKLY_FEATURES":
                    suggestions = getMostReadWeeklyCached(limit);
                    break;
                case "NEW_RELEASES":
                    suggestions = getNewReleasesCached(limit);
                    break;
                case "RECOMMENDED_FOR_YOU":
                case "RECOMMENDED":
                case "BEST_OF_ALL_TIME":
                    suggestions = getTopRatedBooksCached(limit);
                    break;
                default:
                    suggestions = getNewReleasesCached(limit);
                    break;
            }

            // Apply additional filters if provided
            if (suggestions != null) {
                if (minRating != null) {
                    suggestions = suggestions.stream()
                            .filter(s -> ((Number) s.get("averageRating")).doubleValue() >= minRating)
                            .collect(Collectors.toList());
                }

                if (minViews != null) {
                    suggestions = suggestions.stream()
                            .filter(s -> ((Number) s.get("totalViews")).intValue() >= minViews)
                            .collect(Collectors.toList());
                }
            }

            // Store in Redis with TTL
            String cacheKey = SUGGESTIONS_CACHE_KEY + ":" + sectionType + ":" + limit + ":" + genre + ":" + minRating
                    + ":" + minViews;
            redisTemplate.opsForValue().set(cacheKey, suggestions, SUGGESTIONS_TTL, TimeUnit.MINUTES);

            log.info("Cached {} suggestions for section {} for {} minutes",
                    suggestions != null ? suggestions.size() : 0, sectionType, SUGGESTIONS_TTL);
            return suggestions != null ? suggestions : List.of();
        } catch (Exception e) {
            log.error("Error fetching suggestions for section: {}", sectionType, e);
            throw e;
        }
    }

    // Comprehensive dashboard data with caching
    @Cacheable(value = "admin_insights_dashboard", key = "'dashboard_data'")
    public Map<String, Object> getInsightsDashboardCached() {
        log.info("Fetching comprehensive insights dashboard data from database");

        try {
            Map<String, Object> dashboardData = new HashMap<>();

            // Fetch all main categories with smaller limits for dashboard overview
            dashboardData.put("topRated", getTopRatedBooksCached(10));
            dashboardData.put("mostReadWeekly", getMostReadWeeklyCached(10));
            dashboardData.put("newReleases", getNewReleasesCached(10));

            // Fetch books by genre (smaller limits for overview)
            Map<String, Object> byGenre = new HashMap<>();
            String[] genres = { "fantasy", "romance", "mystery", "sci-fi", "adventure", "thriller", "horror", "comedy",
                    "drama", "young-adult" };

            for (String genre : genres) {
                byGenre.put(genre, getBooksByGenreCached(genre, 5));
            }
            dashboardData.put("byGenre", byGenre);

            // Store complete dashboard in Redis with TTL
            redisTemplate.opsForValue().set("admin:insights:dashboard", dashboardData, 20, TimeUnit.MINUTES);

            log.info("Cached complete insights dashboard for 20 minutes");
            return dashboardData;
        } catch (Exception e) {
            log.error("Error fetching insights dashboard", e);
            throw e;
        }
    }

    private String mapGenreToCategory(String genreId) {
        switch (genreId.toLowerCase()) {
            case "fantasy":
                return "Fantasy";
            case "romance":
                return "Romance";
            case "mystery":
                return "Mystery";
            case "sci-fi":
            case "science-fiction":
                return "Science Fiction";
            case "adventure":
                return "Adventure";
            case "thriller":
                return "Thriller";
            case "horror":
                return "Horror";
            case "comedy":
                return "Comedy";
            case "drama":
                return "Drama";
            case "young-adult":
                return "Young Adult";
            default:
                return genreId;
        }
    }

    private Map<String, Object> convertToBookInsight(Story story) {
        Map<String, Object> insight = new HashMap<>();
        insight.put("id", story.getId().toString());
        insight.put("title", story.getTitle());

        // Create author object with displayName and username
        Map<String, String> author = new HashMap<>();
        author.put("displayName", story.getAuthor() != null ? story.getAuthor().getDisplayName() : "Unknown");
        author.put("username", story.getAuthor() != null ? story.getAuthor().getUsername() : "unknown");
        insight.put("author", author);

        insight.put("coverImageUrl", story.getCoverImageUrl());

        // Create category object with id and name
        if (story.getCategory() != null) {
            Map<String, String> category = new HashMap<>();
            category.put("id", story.getCategory().getSlug());
            category.put("name", story.getCategory().getName());
            insight.put("category", category);
        }

        Long totalViews = story.getTotalViews() != null ? story.getTotalViews() : 0L;
        Long totalLikes = story.getTotalLikes() != null ? story.getTotalLikes() : 0L;

        insight.put("totalViews", totalViews);
        insight.put("totalLikes", totalLikes);

        // Calculate rating based on likes-to-views ratio (0.0 to 5.0 scale)
        double averageRating = 0.0;
        if (totalViews > 0 && totalLikes > 0) {
            double ratio = (double) totalLikes / totalViews;
            averageRating = Math.min(5.0, ratio * 25.0);
            averageRating = Math.round(averageRating * 10.0) / 10.0;
        }
        insight.put("averageRating", averageRating);

        insight.put("chapterCount", story.getTotalChapters() != null ? story.getTotalChapters() : 0);
        insight.put("publishedAt",
                story.getPublishedAt() != null ? story.getPublishedAt().toString() : story.getCreatedAt().toString());
        insight.put("weeklyViews", 0);
        insight.put("weeklyLikes", 0);
        insight.put("trendingScore", 0);

        return insight;
    }
}