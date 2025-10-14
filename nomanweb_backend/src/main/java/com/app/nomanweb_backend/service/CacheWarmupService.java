package com.app.nomanweb_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CacheWarmupService {

    private final CachedStoryService cachedStoryService;
    private final CachedAuthService cachedAuthService;

    /**
     * Warm up caches when the application starts
     */
    @EventListener(ApplicationReadyEvent.class)
    @Async
    public void warmUpCachesOnStartup() {
        log.info("Starting cache warmup on application startup...");
        
        try {
            // Warm up story caches
            warmUpStoryCaches();
            
            log.info("Cache warmup completed successfully");
        } catch (Exception e) {
            log.error("Error during cache warmup: {}", e.getMessage(), e);
        }
    }

    /**
     * Scheduled cache warmup - runs every 30 minutes
     */
    @Scheduled(fixedRate = 1800000) // 30 minutes in milliseconds
    @Async
    public void scheduledCacheWarmup() {
        log.info("Starting scheduled cache warmup...");
        
        try {
            // Warm up the most frequently accessed data
            warmUpHighPriorityStoryCaches();
            
            log.info("Scheduled cache warmup completed successfully");
        } catch (Exception e) {
            log.error("Error during scheduled cache warmup: {}", e.getMessage(), e);
        }
    }

    /**
     * Warm up all story-related caches
     */
    public void warmUpStoryCaches() {
        log.info("Warming up story caches...");
        
        // Warm up trending stories (most frequently accessed)
        cachedStoryService.warmUpTrendingStoriesCache();
        
        // Warm up featured stories
        cachedStoryService.warmUpFeaturedStoriesCache();
        
        // Warm up popular stories
        cachedStoryService.warmUpPopularStoriesCache();
        
        log.info("Story caches warmed up successfully");
    }

    /**
     * Warm up only high-priority caches (for scheduled runs)
     */
    public void warmUpHighPriorityStoryCaches() {
        log.info("Warming up high-priority story caches...");
        
        // Only warm up the most frequently accessed caches
        cachedStoryService.warmUpTrendingStoriesCache();
        cachedStoryService.warmUpFeaturedStoriesCache();
        
        log.info("High-priority story caches warmed up successfully");
    }

    /**
     * Manual cache warmup endpoint (can be called via admin interface)
     */
    @Async
    public void manualCacheWarmup() {
        log.info("Starting manual cache warmup...");
        
        try {
            warmUpStoryCaches();
            log.info("Manual cache warmup completed successfully");
        } catch (Exception e) {
            log.error("Error during manual cache warmup: {}", e.getMessage(), e);
        }
    }

    /**
     * Invalidate and refresh all caches
     */
    @Async
    public void refreshAllCaches() {
        log.info("Refreshing all caches...");
        
        try {
            // Invalidate all story caches
            cachedStoryService.invalidateAllStoryCaches();
            
            // Wait a moment for invalidation to complete
            Thread.sleep(1000);
            
            // Warm up caches again
            warmUpStoryCaches();
            
            log.info("All caches refreshed successfully");
        } catch (Exception e) {
            log.error("Error during cache refresh: {}", e.getMessage(), e);
        }
    }

    /**
     * Get cache warmup status
     */
    public String getCacheWarmupStatus() {
        try {
            // Check if key caches have data
            boolean trendingCached = cachedStoryService.getTrendingStoriesFromCache(0, 20) != null;
            boolean featuredCached = cachedStoryService.getFeaturedStoriesFromCache(0, 20) != null;
            boolean popularCached = cachedStoryService.getPopularStoriesFromCache(0, 20) != null;
            
            if (trendingCached && featuredCached && popularCached) {
                return "All primary caches are warmed up";
            } else if (trendingCached || featuredCached || popularCached) {
                return "Some caches are warmed up";
            } else {
                return "Caches are cold";
            }
        } catch (Exception e) {
            log.error("Error checking cache warmup status: {}", e.getMessage());
            return "Error checking cache status";
        }
    }
}