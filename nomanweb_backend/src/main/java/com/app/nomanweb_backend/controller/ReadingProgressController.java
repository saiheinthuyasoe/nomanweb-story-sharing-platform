package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.ReadingProgress;
import com.app.nomanweb_backend.repository.ReadingProgressRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.ChapterRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/reading-progress")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "https://nomanweb.vercel.app" })
public class ReadingProgressController {

    private final ReadingProgressRepository readingProgressRepository;
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final UserRepository userRepository;

    @PostMapping("/chapter/{chapterId}/update")
    public ResponseEntity<?> updateReadingProgress(@PathVariable UUID chapterId,
            @RequestParam BigDecimal progressPercentage,
            Authentication authentication) {
        try {
            System.out.println("Updating progress for chapter: " + chapterId + ", progress: " + progressPercentage);

            // Check if user is authenticated
            if (authentication == null || !authentication.isAuthenticated() ||
                    authentication.getName().equals("anonymousUser")) {
                System.out.println("Anonymous user - skipping progress update");

                // Return a success response for anonymous users without saving anything
                Map<String, Object> response = new HashMap<>();
                response.put("progressPercentage", progressPercentage);
                response.put("isCompleted", progressPercentage.compareTo(new BigDecimal("100")) >= 0);
                response.put("lastReadAt", null);
                response.put("message", "Progress tracked locally (not saved)");

                return ResponseEntity.ok(response);
            }

            String userIdString = authentication.getName();
            System.out.println("Authentication name (should be user ID): " + userIdString);
            UUID userId;
            try {
                userId = UUID.fromString(userIdString);
                System.out.println("Successfully parsed user ID: " + userId);
            } catch (IllegalArgumentException e) {
                System.err.println("Invalid user ID format: " + userIdString);
                throw new RuntimeException("Invalid user ID format: " + userIdString);
            }
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Chapter chapter = chapterRepository.findById(chapterId)
                    .orElseThrow(() -> new RuntimeException("Chapter not found"));

            Story story = chapter.getStory();

            // Find existing progress or create new one
            Optional<ReadingProgress> existingProgress = readingProgressRepository
                    .findByUserIdAndStoryIdAndChapterId(user.getId(), story.getId(), chapterId);

            ReadingProgress progress;
            if (existingProgress.isPresent()) {
                progress = existingProgress.get();
                progress.updateProgress(progressPercentage);
            } else {
                progress = ReadingProgress.builder()
                        .user(user)
                        .story(story)
                        .chapter(chapter)
                        .progressPercentage(progressPercentage)
                        .build();
            }

            readingProgressRepository.save(progress);

            // Increment chapter views if this is the first time reading (progress was 0)
            if (existingProgress.isEmpty() ||
                    existingProgress.get().getProgressPercentage().compareTo(BigDecimal.ZERO) == 0) {
                chapter.incrementViews();
                chapterRepository.save(chapter);

                // Also increment story views
                story.incrementViews();
                storyRepository.save(story);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("progressPercentage", progress.getProgressPercentage());
            response.put("isCompleted", progress.isCompleted());
            response.put("lastReadAt", progress.getLastReadAt());
            response.put("message", "Reading progress updated");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error updating reading progress: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to update reading progress: " + e.getMessage()));
        }
    }

    @GetMapping("/story/{storyId}")
    public ResponseEntity<?> getStoryProgress(@PathVariable UUID storyId, Authentication authentication) {
        try {
            String userIdString = authentication.getName();
            UUID userId = UUID.fromString(userIdString);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<ReadingProgress> progressList = readingProgressRepository
                    .findByUserIdAndStoryIdOrderByLastReadAtDesc(user.getId(), storyId);

            Map<String, Object> response = new HashMap<>();
            response.put("progressList", progressList);

            if (!progressList.isEmpty()) {
                ReadingProgress latestProgress = progressList.get(0);
                response.put("currentChapter", latestProgress.getChapter());
                response.put("lastReadAt", latestProgress.getLastReadAt());

                // Calculate overall story progress
                long totalChapters = chapterRepository.countByStoryIdAndStatus(storyId, Chapter.Status.PUBLISHED);
                long completedChapters = progressList.stream()
                        .map(ReadingProgress::isCompleted)
                        .mapToLong(completed -> completed ? 1 : 0)
                        .sum();

                BigDecimal overallProgress = totalChapters > 0
                        ? BigDecimal.valueOf(completedChapters * 100.0 / totalChapters)
                        : BigDecimal.ZERO;

                response.put("overallProgress", overallProgress);
                response.put("completedChapters", completedChapters);
                response.put("totalChapters", totalChapters);
            } else {
                response.put("overallProgress", BigDecimal.ZERO);
                response.put("completedChapters", 0);
                response.put("totalChapters",
                        chapterRepository.countByStoryIdAndStatus(storyId, Chapter.Status.PUBLISHED));
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to get story progress: " + e.getMessage()));
        }
    }

    @GetMapping("/chapter/{chapterId}")
    public ResponseEntity<?> getChapterProgress(@PathVariable UUID chapterId, Authentication authentication) {
        try {
            System.out.println("Getting chapter progress for chapter: " + chapterId);
            Map<String, Object> response = new HashMap<>();

            // Default values for non-authenticated users
            response.put("progressPercentage", BigDecimal.ZERO);
            response.put("isCompleted", false);
            response.put("lastReadAt", null);
            response.put("hasProgress", false);

            // Check if user is authenticated
            if (authentication != null && authentication.isAuthenticated()) {
                String userIdString = authentication.getName();
                UUID userId = UUID.fromString(userIdString);
                User user = userRepository.findById(userId).orElse(null);

                if (user != null) {
                    Optional<ReadingProgress> progress = readingProgressRepository
                            .findByUserIdAndChapterId(user.getId(), chapterId);

                    if (progress.isPresent()) {
                        ReadingProgress p = progress.get();
                        response.put("progressPercentage", p.getProgressPercentage());
                        response.put("isCompleted", p.isCompleted());
                        response.put("lastReadAt", p.getLastReadAt());
                        response.put("hasProgress", true);
                    }
                }
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to get chapter progress: " + e.getMessage()));
        }
    }

    @GetMapping("/my-progress")
    public ResponseEntity<?> getMyReadingProgress(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        try {
            String userIdString = authentication.getName();
            UUID userId = UUID.fromString(userIdString);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Get latest progress for each story
            List<ReadingProgress> recentProgress = readingProgressRepository
                    .findLatestProgressByUserOrderByLastReadAtDesc(user.getId());

            return ResponseEntity.ok(Map.of(
                    "content", recentProgress,
                    "totalElements", recentProgress.size()));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to get reading progress: " + e.getMessage()));
        }
    }
}