package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.ChapterRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CachedAdminService {

    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    // Cache keys
    private static final String ADMIN_STATS_CACHE_KEY = "admin:dashboard:stats";
    private static final String ADMIN_USER_ANALYTICS_CACHE_KEY = "admin:user:analytics";
    private static final String ADMIN_MONTHLY_DATA_CACHE_KEY = "admin:monthly:data";
    private static final String ADMIN_CONTENT_ANALYTICS_CACHE_KEY = "admin:content:analytics";

    // Cache TTL configurations
    private static final Duration STATS_CACHE_TTL = Duration.ofMinutes(5); // 5 minutes for dashboard stats
    private static final Duration ANALYTICS_CACHE_TTL = Duration.ofMinutes(15); // 15 minutes for analytics
    private static final Duration MONTHLY_DATA_CACHE_TTL = Duration.ofHours(1); // 1 hour for monthly data

    @Cacheable(value = "adminDashboardStats", key = "'dashboard_stats'")
    public Map<String, Object> getDashboardStatsCached() {
        log.info("Fetching dashboard stats from database");
        
        Map<String, Object> stats = new HashMap<>();

        // Get real statistics from database
        long totalStories = storyRepository.count();
        long totalChapters = chapterRepository.count();
        long totalUsers = userRepository.count();

        // Count pending moderations (stories and chapters)
        long pendingStoryModerations = storyRepository
                .countByModerationStatus(Story.ModerationStatus.PENDING);
        long pendingChapterModerations = chapterRepository
                .countByModerationStatus(Chapter.ModerationStatus.PENDING);
        long pendingModerations = pendingStoryModerations + pendingChapterModerations;

        // Recent activity (stories + chapters created in last 24 hours)
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
        long recentStories = storyRepository.countByCreatedAtAfter(yesterday);
        long recentChapters = chapterRepository.countByCreatedAtAfter(yesterday);
        long recentActivity = recentStories + recentChapters;

        stats.put("totalStories", totalStories);
        stats.put("totalChapters", totalChapters);
        stats.put("pendingModerations", pendingModerations);
        stats.put("totalUsers", totalUsers);
        stats.put("recentActivity", recentActivity);

        // Store in Redis with TTL
        redisTemplate.opsForValue().set(ADMIN_STATS_CACHE_KEY, stats, STATS_CACHE_TTL);

        log.info("Dashboard stats cached: Stories={}, Chapters={}, Users={}, Pending={}, Recent={}",
                totalStories, totalChapters, totalUsers, pendingModerations, recentActivity);

        return stats;
    }

    @Cacheable(value = "adminUserAnalytics", key = "'user_analytics'")
    public Map<String, Object> getUserAnalyticsCached() {
        log.info("Fetching user analytics from database");
        
        Map<String, Object> analytics = new HashMap<>();

        // Get total users
        long totalUsers = userRepository.count();

        // Get active users (users who have logged in within the last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long activeUsers = userRepository.countByLastLoginAtAfter(thirtyDaysAgo);

        // Get new users (registered in the last 30 days)
        long newUsers = userRepository.countUsersCreatedAfter(thirtyDaysAgo);

        // Get suspended users
        long suspendedUsers = userRepository.countByStatus(User.Status.SUSPENDED);

        // Get verified users (email verified)
        long verifiedUsers = userRepository.countByEmailVerified(true);

        analytics.put("totalUsers", totalUsers);
        analytics.put("activeUsers", activeUsers);
        analytics.put("newUsers", newUsers);
        analytics.put("suspendedUsers", suspendedUsers);
        analytics.put("verifiedUsers", verifiedUsers);

        // Store in Redis with TTL
        redisTemplate.opsForValue().set(ADMIN_USER_ANALYTICS_CACHE_KEY, analytics, ANALYTICS_CACHE_TTL);

        log.info("User analytics cached: Total={}, Active={}, New={}, Suspended={}, Verified={}",
                totalUsers, activeUsers, newUsers, suspendedUsers, verifiedUsers);

        return analytics;
    }

    @Cacheable(value = "adminMonthlyData", key = "'monthly_data'")
    public Map<String, Object> getMonthlyTimeSeriesDataCached() {
        log.info("Fetching monthly time-series data from database");
        
        Map<String, Object> timeSeriesData = new HashMap<>();

        // Get last 12 months of data
        List<Map<String, Object>> userRegistrations = new ArrayList<>();
        List<Map<String, Object>> revenueData = new ArrayList<>();

        LocalDateTime now = LocalDateTime.now();

        for (int i = 11; i >= 0; i--) {
            LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0)
                    .withMinute(0).withSecond(0).withNano(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);

            // User registrations for this month
            long registrations = userRepository.countUsersCreatedAfter(monthStart) -
                    (i == 0 ? 0 : userRepository.countUsersCreatedAfter(monthEnd.plusSeconds(1)));

            Map<String, Object> userDataPoint = new HashMap<>();
            userDataPoint.put("month", monthStart.getMonth().toString());
            userDataPoint.put("year", monthStart.getYear());
            userDataPoint.put("registrations", registrations);
            userRegistrations.add(userDataPoint);

            // Revenue data for this month (placeholder - will be enhanced with real revenue data)
            Map<String, Object> revenueDataPoint = new HashMap<>();
            revenueDataPoint.put("month", monthStart.getMonth().toString());
            revenueDataPoint.put("year", monthStart.getYear());
            revenueDataPoint.put("revenue", registrations * 10); // Placeholder calculation
            revenueData.add(revenueDataPoint);
        }

        timeSeriesData.put("userRegistrations", userRegistrations);
        timeSeriesData.put("revenueData", revenueData);

        // Store in Redis with TTL
        redisTemplate.opsForValue().set(ADMIN_MONTHLY_DATA_CACHE_KEY, timeSeriesData, MONTHLY_DATA_CACHE_TTL);

        log.info("Monthly time-series data cached with {} months of data", userRegistrations.size());

        return timeSeriesData;
    }

    @Cacheable(value = "adminContentAnalytics", key = "'content_analytics'")
    public Map<String, Object> getContentAnalyticsCached() {
        log.info("Fetching content analytics from database");
        
        Map<String, Object> contentAnalytics = new HashMap<>();

        // Get total published stories
        long publishedStories = storyRepository.countByStatus(Story.Status.PUBLISHED);
        
        // Get total draft stories
        long draftStories = storyRepository.countByStatus(Story.Status.DRAFT);
        
        // Get stories created in last 7 days
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long recentStories = storyRepository.countByCreatedAtAfter(weekAgo);
        
        // Get chapters created in last 7 days
        long recentChapters = chapterRepository.countByCreatedAtAfter(weekAgo);

        contentAnalytics.put("publishedStories", publishedStories);
        contentAnalytics.put("draftStories", draftStories);
        contentAnalytics.put("recentStories", recentStories);
        contentAnalytics.put("recentChapters", recentChapters);

        // Store in Redis with TTL
        redisTemplate.opsForValue().set(ADMIN_CONTENT_ANALYTICS_CACHE_KEY, contentAnalytics, ANALYTICS_CACHE_TTL);

        log.info("Content analytics cached: Published={}, Draft={}, Recent Stories={}, Recent Chapters={}",
                publishedStories, draftStories, recentStories, recentChapters);

        return contentAnalytics;
    }

    // Cache invalidation methods
    public void invalidateAllAdminCaches() {
        log.info("Invalidating all admin caches");
        redisTemplate.delete(ADMIN_STATS_CACHE_KEY);
        redisTemplate.delete(ADMIN_USER_ANALYTICS_CACHE_KEY);
        redisTemplate.delete(ADMIN_MONTHLY_DATA_CACHE_KEY);
        redisTemplate.delete(ADMIN_CONTENT_ANALYTICS_CACHE_KEY);
    }

    public void invalidateDashboardStatsCache() {
        log.info("Invalidating dashboard stats cache");
        redisTemplate.delete(ADMIN_STATS_CACHE_KEY);
    }

    public void invalidateUserAnalyticsCache() {
        log.info("Invalidating user analytics cache");
        redisTemplate.delete(ADMIN_USER_ANALYTICS_CACHE_KEY);
    }

    // Warm up cache methods
    public void warmUpAdminCaches() {
        log.info("Warming up admin caches");
        getDashboardStatsCached();
        getUserAnalyticsCached();
        getContentAnalyticsCached();
        // Monthly data is expensive, so we'll warm it up separately if needed
    }
}