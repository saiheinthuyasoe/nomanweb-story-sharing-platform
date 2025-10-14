package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.chapter.ChapterResponse;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.repository.ChapterRepository;
import com.app.nomanweb_backend.service.impl.ChapterServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CachedModerationService {

    private final ChapterServiceImpl chapterService;
    private final ChapterModerationProcessor chapterModerationProcessor;
    private final ChapterRepository chapterRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "moderation:";
    private static final Duration QUEUE_STATUS_TTL = Duration.ofMinutes(1); // 1 minute for queue status
    private static final Duration CHAPTERS_TTL = Duration.ofMinutes(5); // 5 minutes for chapters list
    private static final Duration STATS_TTL = Duration.ofMinutes(5); // 5 minutes for moderation stats

    /**
     * Get cached queue status with 1-minute TTL
     */
    public Map<String, Object> getQueueStatusCached() {
        String cacheKey = CACHE_PREFIX + "queue_status";

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> cached = (Map<String, Object>) redisTemplate.opsForValue().get(cacheKey);

            if (cached != null) {
                log.debug("Cache hit for queue status");
                return cached;
            }

            log.debug("Cache miss for queue status, fetching from processor");
            Map<String, Object> status = chapterModerationProcessor.getProcessorStatus();

            // Cache with TTL
            redisTemplate.opsForValue().set(cacheKey, status, QUEUE_STATUS_TTL);
            log.debug("Cached queue status for {} minutes", QUEUE_STATUS_TTL.toMinutes());

            return status;
        } catch (Exception e) {
            log.error("Error in cached queue status, falling back to direct call", e);
            return chapterModerationProcessor.getProcessorStatus();
        }
    }

    /**
     * Get cached chapters for moderation with 5-minute TTL
     */
    public Page<ChapterResponse> getChaptersForModerationCached(Pageable pageable) {
        String cacheKey = CACHE_PREFIX + "chapters:" + pageable.getPageNumber() + ":" + pageable.getPageSize();

        try {
            @SuppressWarnings("unchecked")
            Page<ChapterResponse> cached = (Page<ChapterResponse>) redisTemplate.opsForValue().get(cacheKey);

            if (cached != null) {
                log.debug("Cache hit for moderation chapters page {}", pageable.getPageNumber());
                return cached;
            }

            log.debug("Cache miss for moderation chapters, fetching from service");
            Page<ChapterResponse> chapters = chapterService.getChaptersForModeration(pageable);

            // Cache with TTL
            redisTemplate.opsForValue().set(cacheKey, chapters, CHAPTERS_TTL);
            log.debug("Cached moderation chapters for {} minutes", CHAPTERS_TTL.toMinutes());

            return chapters;
        } catch (Exception e) {
            log.error("Error in cached chapters for moderation, falling back to direct call", e);
            return chapterService.getChaptersForModeration(pageable);
        }
    }

    /**
     * Get cached moderation statistics with 5-minute TTL
     */
    public Map<String, Object> getModerationStatsCached() {
        String cacheKey = CACHE_PREFIX + "stats";

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> cached = (Map<String, Object>) redisTemplate.opsForValue().get(cacheKey);

            if (cached != null) {
                log.debug("Cache hit for moderation stats");
                return cached;
            }

            log.debug("Cache miss for moderation stats, fetching from database");
            Map<String, Object> stats = calculateModerationStats();

            // Cache with TTL
            redisTemplate.opsForValue().set(cacheKey, stats, STATS_TTL);
            log.debug("Cached moderation stats for {} minutes", STATS_TTL.toMinutes());

            return stats;
        } catch (Exception e) {
            log.error("Error in cached moderation stats, falling back to direct calculation", e);
            return calculateModerationStats();
        }
    }

    /**
     * Calculate moderation statistics from database
     */
    private Map<String, Object> calculateModerationStats() {
        Map<String, Object> stats = new HashMap<>();

        try {
            // Get today's date for daily stats
            LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);

            // Count chapters by moderation status
            long pendingReviews = chapterRepository.countByModerationStatus(Chapter.ModerationStatus.PENDING);
            long approved = chapterRepository.countByModerationStatus(Chapter.ModerationStatus.APPROVED);
            long rejected = chapterRepository.countByModerationStatus(Chapter.ModerationStatus.REJECTED);

            // Count chapters flagged today (rejected today)
            long flaggedToday = chapterRepository.countByModerationStatusAndUpdatedAtAfter(
                    Chapter.ModerationStatus.REJECTED, startOfDay);

            // Calculate detection accuracy (approved + rejected / total processed)
            long totalProcessed = approved + rejected;
            double detectionAccuracy = totalProcessed > 0 ? ((double) (approved + rejected) / totalProcessed) * 100
                    : 0.0;

            stats.put("flaggedToday", flaggedToday);
            stats.put("pendingReviews", pendingReviews);
            stats.put("approved", approved);
            stats.put("rejected", rejected);
            stats.put("detectionAccuracy", Math.round(detectionAccuracy * 100.0) / 100.0); // Round to 2 decimal places

            log.debug(
                    "Calculated moderation stats: pending={}, approved={}, rejected={}, flaggedToday={}, accuracy={}%",
                    pendingReviews, approved, rejected, flaggedToday, detectionAccuracy);

        } catch (Exception e) {
            log.error("Error calculating moderation stats", e);
            // Return default stats on error
            stats.put("flaggedToday", 0);
            stats.put("pendingReviews", 0);
            stats.put("approved", 0);
            stats.put("rejected", 0);
            stats.put("detectionAccuracy", 0.0);
        }

        return stats;
    }

    /**
     * Clear only the queue status cache for real-time AI moderation updates
     */
    public void clearQueueStatusCache() {
        try {
            redisTemplate.delete(CACHE_PREFIX + "queue_status");
            log.debug("Cleared queue status cache for real-time updates");
        } catch (Exception e) {
            log.error("Error clearing queue status cache", e);
        }
    }

    /**
     * Clear moderation-related caches when data changes
     */
    public void clearModerationCaches() {
        try {
            // Clear queue status cache
            redisTemplate.delete(CACHE_PREFIX + "queue_status");

            // Clear stats cache
            redisTemplate.delete(CACHE_PREFIX + "stats");

            // Clear chapters cache (all pages)
            String pattern = CACHE_PREFIX + "chapters:*";
            redisTemplate.delete(redisTemplate.keys(pattern));

            log.info("Cleared moderation caches");
        } catch (Exception e) {
            log.error("Error clearing moderation caches", e);
        }
    }

    /**
     * Clear specific chapter cache when a chapter is moderated
     */
    public void clearChaptersCacheAfterModeration() {
        try {
            // Clear stats cache since moderation actions affect statistics
            redisTemplate.delete(CACHE_PREFIX + "stats");

            String pattern = CACHE_PREFIX + "chapters:*";
            redisTemplate.delete(redisTemplate.keys(pattern));
            log.debug("Cleared chapters and stats cache after moderation action");
        } catch (Exception e) {
            log.error("Error clearing chapters cache after moderation", e);
        }
    }

    /**
     * Clear chapters cache when new chapters are queued for moderation
     */
    public void clearChaptersCache() {
        try {
            String pattern = CACHE_PREFIX + "chapters:*";
            redisTemplate.delete(redisTemplate.keys(pattern));
            log.debug("Cleared chapters cache after new chapter queued");
        } catch (Exception e) {
            log.error("Error clearing chapters cache", e);
        }
    }
}