package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.Notification;
import com.app.nomanweb_backend.repository.ChapterRepository;
import com.app.nomanweb_backend.dto.moderation.ContentModerationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChapterModerationProcessor {

    private final ChapterModerationQueueService queueService;
    private final ChapterRepository chapterRepository;
    private final ContentModerationService contentModerationService;
    private final NotificationService notificationService;
    private volatile boolean processing = false;
    private volatile boolean aiModerationEnabled = false;

    /**
     * Process jobs from the queue every 5 seconds (only when AI moderation is
     * enabled)
     */
    @Scheduled(fixedDelay = 5000)
    public void processQueue() {
        log.debug("processQueue() called - processing: {}, aiModerationEnabled: {}", processing, aiModerationEnabled);
        if (processing || !aiModerationEnabled) {
            return; // Prevent concurrent processing or skip if AI moderation is disabled
        }

        processing = true;
        try {
            log.debug("Starting to process queue sequentially");
            // Process jobs one by one sequentially to ensure proper notification workflow
            Map<String, Object> job = queueService.getNextJob();
            if (job != null) {
                log.info("Found job to process: {}", job.get("jobId"));
                // Process job synchronously to ensure completion before moving to next
                processJobSync(job);
            } else {
                log.debug("No jobs in queue");
            }
        } finally {
            processing = false;
        }
    }

    /**
     * Process a single job synchronously for sequential workflow
     */
    public void processJobSync(Map<String, Object> job) {
        String jobId = (String) job.get("jobId");
        String chapterId = (String) job.get("chapterId");
        String operation = (String) job.get("operation");

        log.info("Processing moderation job {} for chapter {} (operation: {})",
                jobId, chapterId, operation);

        try {
            Optional<Chapter> chapterOpt = chapterRepository.findById(UUID.fromString(chapterId));
            if (chapterOpt.isEmpty()) {
                queueService.markJobFailed(jobId, "Chapter not found: " + chapterId);
                return;
            }

            Chapter chapter = chapterOpt.get();

            // Perform AI moderation
            ContentModerationResult result = moderateChapterContent(chapter);

            // Update chapter based on moderation result
            updateChapterModerationStatus(chapter, result, operation);

            // Send notification to author - this completes before moving to next job
            sendModerationNotification(chapter, result);

            // Mark job as completed
            Map<String, Object> jobResult = new HashMap<>();
            jobResult.put("moderationStatus", chapter.getModerationStatus().toString());
            jobResult.put("confidenceScore", result.getConfidenceScore());
            jobResult.put("isOffensive", result.isOffensive());
            jobResult.put("processedAt", LocalDateTime.now().toString());

            queueService.markJobCompleted(jobId, jobResult);

            log.info("Successfully processed moderation job {} for chapter {} and sent notification", jobId, chapterId);

        } catch (Exception e) {
            log.error("Failed to process moderation job {} for chapter {}", jobId, chapterId, e);
            queueService.markJobFailed(jobId, e.getMessage());
        }
    }

    /**
     * Process a single job asynchronously (kept for backward compatibility)
     */
    @Async
    public CompletableFuture<Void> processJobAsync(Map<String, Object> job) {
        String jobId = (String) job.get("jobId");
        String chapterId = (String) job.get("chapterId");
        String operation = (String) job.get("operation");

        log.info("Processing moderation job {} for chapter {} (operation: {})",
                jobId, chapterId, operation);

        try {
            Optional<Chapter> chapterOpt = chapterRepository.findById(UUID.fromString(chapterId));
            if (chapterOpt.isEmpty()) {
                queueService.markJobFailed(jobId, "Chapter not found: " + chapterId);
                return CompletableFuture.completedFuture(null);
            }

            Chapter chapter = chapterOpt.get();

            // Perform AI moderation
            ContentModerationResult result = moderateChapterContent(chapter);

            // Update chapter based on moderation result
            updateChapterModerationStatus(chapter, result, operation);

            // Send notification to author
            sendModerationNotification(chapter, result);

            // Mark job as completed
            Map<String, Object> jobResult = new HashMap<>();
            jobResult.put("moderationStatus", chapter.getModerationStatus().toString());
            jobResult.put("confidenceScore", result.getConfidenceScore());
            jobResult.put("isOffensive", result.isOffensive());
            jobResult.put("processedAt", LocalDateTime.now().toString());

            queueService.markJobCompleted(jobId, jobResult);

            log.info("Successfully processed moderation job {} for chapter {}", jobId, chapterId);

        } catch (Exception e) {
            log.error("Failed to process moderation job {} for chapter {}", jobId, chapterId, e);
            queueService.markJobFailed(jobId, e.getMessage());
        }

        return CompletableFuture.completedFuture(null);
    }

    @Transactional
    private ContentModerationResult moderateChapterContent(Chapter chapter) {
        try {
            // Use the existing content moderation service
            return contentModerationService.moderateChapterContent(
                    chapter.getTitle(), chapter.getContent());
        } catch (Exception e) {
            log.error("AI moderation failed for chapter {}", chapter.getId(), e);

            // Return a default result indicating failure
            ContentModerationResult failureResult = new ContentModerationResult();
            failureResult.setOffensive(false); // Default to safe when AI fails
            failureResult.setConfidenceScore(0.0);
            failureResult.setErrorMessage("AI moderation service unavailable: " + e.getMessage());
            failureResult.setAnalysisDetails("Defaulted to approved due to service failure");

            return failureResult;
        }
    }

    @Transactional
    private void updateChapterModerationStatus(Chapter chapter, ContentModerationResult result, String operation) {
        // Use the comprehensive shouldAutoApprove logic instead of just checking
        // isOffensive
        boolean shouldApprove = contentModerationService.shouldAutoApprove(result);

        if (!shouldApprove) {
            // Rejected chapters go back to DRAFT status
            chapter.setModerationStatus(Chapter.ModerationStatus.REJECTED);
            chapter.setStatus(Chapter.Status.DRAFT);
            chapter.setModerationNotes(
                    "AI detected potentially problematic content: " + result.getPredictedCategory() + ". " +
                            (result.getAnalysisDetails() != null ? result.getAnalysisDetails() : ""));
            chapter.setPublishedAt(null); // Clear published date

            log.info("Chapter {} rejected by AI moderation - category: {}, moved to DRAFT",
                    chapter.getId(), result.getPredictedCategory());
        } else {
            // Approved chapters - set status based on original operation
            chapter.setModerationStatus(Chapter.ModerationStatus.APPROVED);
            chapter.setModerationNotes("AI moderation passed. Category: " + result.getPredictedCategory() +
                    ", Confidence: " + String.format("%.2f", result.getConfidenceScore() * 100) + "%");

            // Determine final status based on operation type
            if (operation != null && operation.contains("DRAFT")) {
                // Originally intended as draft - keep as DRAFT
                chapter.setStatus(Chapter.Status.DRAFT);
                log.info("Chapter {} approved by AI moderation - kept as DRAFT (operation: {})",
                        chapter.getId(), operation);
            } else {
                // Originally intended for publishing - set to PUBLISHED
                chapter.setStatus(Chapter.Status.PUBLISHED);
                chapter.setPublishedAt(java.time.LocalDateTime.now());
                log.info("Chapter {} approved by AI moderation - published (operation: {})",
                        chapter.getId(), operation);
            }
        }

        chapterRepository.save(chapter);

        log.info("Updated chapter {} - moderation: {}, status: {}",
                chapter.getId(), chapter.getModerationStatus(), chapter.getStatus());
    }

    private void sendModerationNotification(Chapter chapter, ContentModerationResult result) {
        try {
            var author = chapter.getStory().getAuthor();
            String title;
            String message;

            // Use the comprehensive shouldAutoApprove logic instead of just checking
            // isOffensive
            boolean shouldApprove = contentModerationService.shouldAutoApprove(result);

            if (!shouldApprove) {
                title = "Chapter Moderation Rejected";

                // Provide specific rejection reason based on detected category
                String rejectionReason = getRejectionReason(result.getPredictedCategory());

                message = String.format(
                        "Your chapter '%s' in story '%s' has been rejected because of %s. " +
                                "Please review and edit the content before resubmitting.",
                        chapter.getTitle(),
                        chapter.getStory().getTitle(),
                        rejectionReason);
            } else {
                title = "Chapter Moderation Approved";
                message = String.format(
                        "Your chapter '%s' in story '%s' has passed moderation review and is now published.",
                        chapter.getTitle(),
                        chapter.getStory().getTitle());
            }

            // Use sendModerationNotification to ensure proper preference checking and
            // multi-channel delivery
            notificationService.sendModerationNotification(
                    author.getId(),
                    title,
                    message,
                    Notification.RelatedType.CHAPTER,
                    chapter.getId());

        } catch (Exception e) {
            log.error("Failed to send moderation notification for chapter {}", chapter.getId(), e);
            // Don't fail the job for notification errors
        }
    }

    private String getRejectionReason(String predictedCategory) {
        if (predictedCategory == null) {
            return "potentially problematic content";
        }

        String category = predictedCategory.toLowerCase();
        if (category.contains("offensive")) {
            return "offensive content";
        } else if (category.contains("hate")) {
            return "hate speech";
        } else if (category.contains("religious")) {
            return "religious content";
        } else if (category.contains("political")) {
            return "political content";
        } else {
            return "potentially problematic content";
        }
    }

    /**
     * Start AI moderation processing
     */
    public boolean startAiModeration() {
        if (aiModerationEnabled) {
            log.info("AI moderation is already running");
            return false;
        }

        aiModerationEnabled = true;
        log.info("AI moderation started successfully");
        return true;
    }

    /**
     * Stop AI moderation processing
     */
    public boolean stopAiModeration() {
        if (!aiModerationEnabled) {
            log.info("AI moderation is not running");
            return false;
        }

        aiModerationEnabled = false;
        log.info("AI moderation stopped successfully");
        return true;
    }

    /**
     * Get processor status and statistics
     */
    public Map<String, Object> getProcessorStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("processing", processing);
        status.put("aiModerationEnabled", aiModerationEnabled);
        status.put("queueStats", queueService.getQueueStats());
        status.put("processingJobs", queueService.getProcessingJobs());
        status.put("pendingChapters", getPendingChapters());
        status.put("lastProcessedAt", LocalDateTime.now().toString());
        return status;
    }

    /**
     * Get pending chapters for moderation queue display
     */
    private java.util.List<Map<String, Object>> getPendingChapters() {
        try {
            return chapterRepository.findByModerationStatusWithStoryAndAuthor(Chapter.ModerationStatus.PENDING)
                    .stream()
                    .limit(20) // Limit to 20 most recent pending chapters
                    .map(chapter -> {
                        Map<String, Object> chapterInfo = new HashMap<>();
                        chapterInfo.put("id", chapter.getId().toString());
                        chapterInfo.put("title", chapter.getTitle());
                        chapterInfo.put("storyTitle", chapter.getStory().getTitle());
                        chapterInfo.put("authorName", chapter.getStory().getAuthor().getUsername());
                        chapterInfo.put("createdAt", chapter.getCreatedAt().toString());
                        chapterInfo.put("moderationStatus", chapter.getModerationStatus().toString());
                        chapterInfo.put("priority", 2); // Default medium priority
                        return chapterInfo;
                    })
                    .collect(java.util.stream.Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching pending chapters for queue status", e);
            return java.util.Collections.emptyList();
        }
    }
}