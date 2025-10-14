package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.Chapter;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChapterModerationQueueService {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String QUEUE_KEY = "chapter_moderation_queue";
    private static final String PROCESSING_KEY = "chapter_moderation_processing";
    private static final String COMPLETED_KEY = "chapter_moderation_completed";
    private static final String FAILED_KEY = "chapter_moderation_failed";
    private static final String STATS_KEY = "chapter_moderation_stats";

    /**
     * Add a chapter to the moderation queue
     */
    public String queueChapterForModeration(Chapter chapter, String operation) {
        try {
            String jobId = UUID.randomUUID().toString();

            Map<String, Object> job = new HashMap<>();
            job.put("jobId", jobId);
            job.put("chapterId", chapter.getId());
            job.put("operation", operation); // "CREATE", "UPDATE", "PUBLISH"
            job.put("priority", determinePriority(operation));
            job.put("queuedAt", LocalDateTime.now().toString());
            job.put("retryCount", 0);
            job.put("maxRetries", 3);

            String jobJson = objectMapper.writeValueAsString(job);

            // Add to queue with priority (lower score = higher priority)
            double score = System.currentTimeMillis() + getPriorityOffset(operation);
            redisTemplate.opsForZSet().add(QUEUE_KEY, jobJson, score);

            // Update stats
            incrementStat("queued");

            // Clear chapters cache so new chapter appears immediately in moderation queue
            clearChaptersCache();

            log.info("Chapter {} queued for moderation with job ID: {}", chapter.getId(), jobId);
            return jobId;

        } catch (JsonProcessingException e) {
            log.error("Failed to queue chapter for moderation: {}", chapter.getId(), e);
            throw new RuntimeException("Failed to queue chapter for moderation", e);
        }
    }

    /**
     * Get the next job from the queue
     */
    public Map<String, Object> getNextJob() {
        try {
            // Get the highest priority job (lowest score)
            var jobs = redisTemplate.opsForZSet().rangeWithScores(QUEUE_KEY, 0, 0);

            if (jobs.isEmpty()) {
                return null;
            }

            var job = jobs.iterator().next();
            String jobJson = job.getValue();

            // Remove from queue and add to processing
            redisTemplate.opsForZSet().remove(QUEUE_KEY, jobJson);
            redisTemplate.opsForHash().put(PROCESSING_KEY, getJobId(jobJson), jobJson);

            @SuppressWarnings("unchecked")
            Map<String, Object> jobData = objectMapper.readValue(jobJson, Map.class);
            jobData.put("startedAt", LocalDateTime.now().toString());

            return jobData;

        } catch (Exception e) {
            log.error("Failed to get next job from queue", e);
            return null;
        }
    }

    /**
     * Mark a job as completed
     */
    public void markJobCompleted(String jobId, Map<String, Object> result) {
        try {
            // Remove from processing
            String jobJson = (String) redisTemplate.opsForHash().get(PROCESSING_KEY, jobId);
            if (jobJson != null) {
                redisTemplate.opsForHash().delete(PROCESSING_KEY, jobId);

                // Add completion info
                @SuppressWarnings("unchecked")
                Map<String, Object> jobData = objectMapper.readValue(jobJson, Map.class);
                jobData.put("completedAt", LocalDateTime.now().toString());
                jobData.put("result", result);

                // Store in completed (with TTL of 24 hours)
                String completedJson = objectMapper.writeValueAsString(jobData);
                redisTemplate.opsForHash().put(COMPLETED_KEY, jobId, completedJson);
                redisTemplate.expire(COMPLETED_KEY, java.time.Duration.ofHours(24));

                incrementStat("completed");
                log.info("Job {} marked as completed", jobId);
            }
        } catch (Exception e) {
            log.error("Failed to mark job as completed: {}", jobId, e);
        }
    }

    /**
     * Mark a job as failed and potentially retry
     */
    public void markJobFailed(String jobId, String error) {
        try {
            String jobJson = (String) redisTemplate.opsForHash().get(PROCESSING_KEY, jobId);
            if (jobJson != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> jobData = objectMapper.readValue(jobJson, Map.class);

                int retryCount = (Integer) jobData.getOrDefault("retryCount", 0);
                int maxRetries = (Integer) jobData.getOrDefault("maxRetries", 3);

                jobData.put("retryCount", retryCount + 1);
                jobData.put("lastError", error);
                jobData.put("failedAt", LocalDateTime.now().toString());

                if (retryCount < maxRetries) {
                    // Retry with exponential backoff
                    double delay = Math.pow(2, retryCount) * 60000; // Start with 1 minute
                    double score = System.currentTimeMillis() + delay;

                    String updatedJson = objectMapper.writeValueAsString(jobData);
                    redisTemplate.opsForZSet().add(QUEUE_KEY, updatedJson, score);

                    log.info("Job {} failed, retrying in {} ms (attempt {}/{})",
                            jobId, delay, retryCount + 1, maxRetries);
                } else {
                    // Max retries reached, move to failed
                    String failedJson = objectMapper.writeValueAsString(jobData);
                    redisTemplate.opsForHash().put(FAILED_KEY, jobId, failedJson);
                    incrementStat("failed");

                    log.error("Job {} failed permanently after {} retries", jobId, maxRetries);
                }

                // Remove from processing
                redisTemplate.opsForHash().delete(PROCESSING_KEY, jobId);
            }
        } catch (Exception e) {
            log.error("Failed to handle job failure: {}", jobId, e);
        }
    }

    /**
     * Get queue statistics
     */
    public Map<String, Object> getQueueStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("queueSize", redisTemplate.opsForZSet().count(QUEUE_KEY, 0, Double.MAX_VALUE));
        stats.put("processing", redisTemplate.opsForHash().size(PROCESSING_KEY));
        stats.put("completed", redisTemplate.opsForHash().size(COMPLETED_KEY));
        stats.put("failed", redisTemplate.opsForHash().size(FAILED_KEY));

        // Get daily stats
        Map<Object, Object> dailyStats = redisTemplate.opsForHash().entries(STATS_KEY);
        stats.put("dailyStats", dailyStats);

        return stats;
    }

    /**
     * Get detailed information about currently processing jobs
     */
    public List<Map<String, Object>> getProcessingJobs() {
        List<Map<String, Object>> processingJobs = new ArrayList<>();

        try {
            Map<Object, Object> processingData = redisTemplate.opsForHash().entries(PROCESSING_KEY);

            for (Map.Entry<Object, Object> entry : processingData.entrySet()) {
                String jobJson = (String) entry.getValue();
                @SuppressWarnings("unchecked")
                Map<String, Object> jobData = objectMapper.readValue(jobJson, Map.class);

                // Calculate progress based on time elapsed (mock progress for now)
                String startedAtStr = (String) jobData.get("startedAt");
                if (startedAtStr != null) {
                    LocalDateTime startedAt = LocalDateTime.parse(startedAtStr);
                    LocalDateTime now = LocalDateTime.now();
                    long secondsElapsed = java.time.Duration.between(startedAt, now).getSeconds();

                    // Mock progress calculation (assume 60 seconds for completion)
                    int progress = Math.min(95, (int) ((secondsElapsed * 100) / 60));
                    jobData.put("progress", progress);
                    jobData.put("estimatedTimeRemaining", Math.max(0, 60 - secondsElapsed));
                }

                processingJobs.add(jobData);
            }

        } catch (Exception e) {
            log.error("Failed to get processing jobs", e);
        }

        return processingJobs;
    }

    private int determinePriority(String operation) {
        return switch (operation) {
            case "PUBLISH" -> 1; // Highest priority
            case "UPDATE" -> 2;
            case "CREATE" -> 3;
            default -> 5;
        };
    }

    private long getPriorityOffset(String operation) {
        return determinePriority(operation) * 1000L; // Offset in milliseconds
    }

    private String getJobId(String jobJson) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> job = objectMapper.readValue(jobJson, Map.class);
            return (String) job.get("jobId");
        } catch (Exception e) {
            return "unknown";
        }
    }

    private void incrementStat(String statName) {
        String today = LocalDateTime.now().toLocalDate().toString();
        String key = today + ":" + statName;
        redisTemplate.opsForHash().increment(STATS_KEY, key, 1);
        redisTemplate.expire(STATS_KEY, java.time.Duration.ofDays(30)); // Keep stats for 30 days
    }

    /**
     * Clear chapters cache when new chapters are queued for moderation
     */
    private void clearChaptersCache() {
        try {
            String pattern = "moderation:chapters:*";
            redisTemplate.delete(redisTemplate.keys(pattern));
            log.debug("Cleared chapters cache after new chapter queued");
        } catch (Exception e) {
            log.error("Error clearing chapters cache", e);
        }
    }
}