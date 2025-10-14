package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.story.StoryPreviewResponse;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.service.impl.StoryServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CachedStoryService {

    private final StoryServiceImpl storyService;
    private final RedisTemplate<String, Object> redisTemplate;

    // Cache keys
    private static final String TRENDING_STORIES_CACHE_PREFIX = "trending:stories:";
    private static final String FEATURED_STORIES_CACHE_PREFIX = "featured:stories:";
    private static final String POPULAR_STORIES_CACHE_PREFIX = "popular:stories:";
    private static final String CATEGORY_STORIES_CACHE_PREFIX = "category:stories:";
    private static final String SEARCH_RESULTS_CACHE_PREFIX = "search:stories:";

    // Cache TTL configurations
    private static final Duration TRENDING_CACHE_TTL = Duration.ofMinutes(15); // 15 minutes for trending
    private static final Duration FEATURED_CACHE_TTL = Duration.ofHours(1); // 1 hour for featured
    private static final Duration POPULAR_CACHE_TTL = Duration.ofMinutes(30); // 30 minutes for popular
    private static final Duration CATEGORY_CACHE_TTL = Duration.ofMinutes(20); // 20 minutes for category
    private static final Duration SEARCH_CACHE_TTL = Duration.ofMinutes(10); // 10 minutes for search

    @Cacheable(value = "trendingStories", key = "#page + ':' + #size")
    public Page<StoryPreviewResponse> getTrendingStoriesCached(int page, int size) {
        log.info("Fetching trending stories from database (page: {}, size: {})", page, size);
        Page<StoryPreviewResponse> stories = storyService.getTrendingStories(page, size);

        // Also store in Redis with TTL
        String cacheKey = TRENDING_STORIES_CACHE_PREFIX + page + ":" + size;
        redisTemplate.opsForValue().set(cacheKey, stories, TRENDING_CACHE_TTL);

        return stories;
    }

    @Cacheable(value = "featuredStories", key = "#page + ':' + #size")
    public Page<StoryPreviewResponse> getFeaturedStoriesCached(int page, int size) {
        log.info("Fetching featured stories from database (page: {}, size: {})", page, size);
        Page<StoryPreviewResponse> stories = storyService.getFeaturedStories(page, size);

        // Also store in Redis with TTL
        String cacheKey = FEATURED_STORIES_CACHE_PREFIX + page + ":" + size;
        redisTemplate.opsForValue().set(cacheKey, stories, FEATURED_CACHE_TTL);

        return stories;
    }

    @Cacheable(value = "popularStories", key = "#page + ':' + #size")
    public Page<StoryPreviewResponse> getPopularStoriesCached(int page, int size) {
        log.info("Fetching popular stories from database (page: {}, size: {})", page, size);
        Page<StoryPreviewResponse> stories = storyService.getPopularStories(page, size);

        // Also store in Redis with TTL
        String cacheKey = POPULAR_STORIES_CACHE_PREFIX + page + ":" + size;
        redisTemplate.opsForValue().set(cacheKey, stories, POPULAR_CACHE_TTL);

        return stories;
    }

    @Cacheable(value = "categoryStories", key = "#categoryId + ':' + #page + ':' + #size")
    public Page<StoryPreviewResponse> getStoriesByCategoryCached(UUID categoryId, int page, int size) {
        log.info("Fetching stories by category from database (categoryId: {}, page: {}, size: {})", categoryId, page, size);
        Page<StoryPreviewResponse> stories = storyService.getStoriesByCategory(categoryId, page, size);

        // Also store in Redis with TTL
        String cacheKey = CATEGORY_STORIES_CACHE_PREFIX + categoryId + ":" + page + ":" + size;
        redisTemplate.opsForValue().set(cacheKey, stories, CATEGORY_CACHE_TTL);

        return stories;
    }

    @Cacheable(value = "searchResults", key = "#query + ':' + #page + ':' + #size")
    public Page<StoryPreviewResponse> searchStoriesCached(String query, int page, int size) {
        log.info("Searching stories from database (query: {}, page: {}, size: {})", query, page, size);
        Page<StoryPreviewResponse> stories = storyService.searchStories(query, page, size);

        // Also store in Redis with TTL
        String cacheKey = SEARCH_RESULTS_CACHE_PREFIX + query + ":" + page + ":" + size;
        redisTemplate.opsForValue().set(cacheKey, stories, SEARCH_CACHE_TTL);

        return stories;
    }

    // Cache invalidation methods
    @CacheEvict(value = "trendingStories", allEntries = true)
    public void invalidateTrendingStoriesCache() {
        log.info("Invalidating trending stories cache");
        String pattern = TRENDING_STORIES_CACHE_PREFIX + "*";
        redisTemplate.delete(redisTemplate.keys(pattern));
    }

    @CacheEvict(value = "featuredStories", allEntries = true)
    public void invalidateFeaturedStoriesCache() {
        log.info("Invalidating featured stories cache");
        String pattern = FEATURED_STORIES_CACHE_PREFIX + "*";
        redisTemplate.delete(redisTemplate.keys(pattern));
    }

    @CacheEvict(value = "popularStories", allEntries = true)
    public void invalidatePopularStoriesCache() {
        log.info("Invalidating popular stories cache");
        String pattern = POPULAR_STORIES_CACHE_PREFIX + "*";
        redisTemplate.delete(redisTemplate.keys(pattern));
    }

    @CacheEvict(value = "categoryStories", allEntries = true)
    public void invalidateCategoryStoriesCache() {
        log.info("Invalidating category stories cache");
        String pattern = CATEGORY_STORIES_CACHE_PREFIX + "*";
        redisTemplate.delete(redisTemplate.keys(pattern));
    }

    @CacheEvict(value = "searchResults", allEntries = true)
    public void invalidateSearchResultsCache() {
        log.info("Invalidating search results cache");
        String pattern = SEARCH_RESULTS_CACHE_PREFIX + "*";
        redisTemplate.delete(redisTemplate.keys(pattern));
    }

    // Invalidate all story-related caches (useful when stories are updated)
    public void invalidateAllStoryCaches() {
        log.info("Invalidating all story caches");
        invalidateTrendingStoriesCache();
        invalidateFeaturedStoriesCache();
        invalidatePopularStoriesCache();
        invalidateCategoryStoriesCache();
        invalidateSearchResultsCache();
    }

    // Get cached data directly from Redis (for debugging/monitoring)
    public Object getTrendingStoriesFromCache(int page, int size) {
        String cacheKey = TRENDING_STORIES_CACHE_PREFIX + page + ":" + size;
        return redisTemplate.opsForValue().get(cacheKey);
    }

    public Object getFeaturedStoriesFromCache(int page, int size) {
        String cacheKey = FEATURED_STORIES_CACHE_PREFIX + page + ":" + size;
        return redisTemplate.opsForValue().get(cacheKey);
    }

    public Object getPopularStoriesFromCache(int page, int size) {
        String cacheKey = POPULAR_STORIES_CACHE_PREFIX + page + ":" + size;
        return redisTemplate.opsForValue().get(cacheKey);
    }

    // Warm up cache methods (can be called on application startup or scheduled)
    public void warmUpTrendingStoriesCache() {
        log.info("Warming up trending stories cache");
        getTrendingStoriesCached(0, 20); // First page with default size
        getTrendingStoriesCached(0, 10); // Common smaller size
    }

    public void warmUpFeaturedStoriesCache() {
        log.info("Warming up featured stories cache");
        getFeaturedStoriesCached(0, 20); // First page with default size
        getFeaturedStoriesCached(0, 10); // Common smaller size
    }

    public void warmUpPopularStoriesCache() {
        log.info("Warming up popular stories cache");
        getPopularStoriesCached(0, 20); // First page with default size
        getPopularStoriesCached(0, 10); // Common smaller size
    }

    public void warmUpAllCaches() {
        log.info("Warming up all story caches");
        warmUpTrendingStoriesCache();
        warmUpFeaturedStoriesCache();
        warmUpPopularStoriesCache();
    }

}