package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.chapter.ChapterResponse;
import com.app.nomanweb_backend.dto.story.StoryResponse;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.repository.ChapterRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.service.ChapterService;
import com.app.nomanweb_backend.service.StoryService;
import com.app.nomanweb_backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

        private final ChapterService chapterService;
        private final StoryService storyService;
        private final JwtUtil jwtUtil;
        private final StoryRepository storyRepository;
        private final ChapterRepository chapterRepository;
        private final UserRepository userRepository;

        // Dashboard Statistics
        @GetMapping("/dashboard/stats")
        public ResponseEntity<Map<String, Object>> getDashboardStats() {
                try {
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
                        java.time.LocalDateTime yesterday = java.time.LocalDateTime.now().minusDays(1);
                        long recentStories = storyRepository.countByCreatedAtAfter(yesterday);
                        long recentChapters = chapterRepository.countByCreatedAtAfter(yesterday);
                        long recentActivity = recentStories + recentChapters;

                        stats.put("totalStories", totalStories);
                        stats.put("totalChapters", totalChapters);
                        stats.put("pendingModerations", pendingModerations);
                        stats.put("totalUsers", totalUsers);
                        stats.put("recentActivity", recentActivity);

                        log.info("Dashboard stats: Stories={}, Chapters={}, Users={}, Pending={}, Recent={}",
                                        totalStories, totalChapters, totalUsers, pendingModerations, recentActivity);

                        return ResponseEntity.ok(stats);
                } catch (Exception e) {
                        log.error("Error getting dashboard stats", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        // Moderation Queue - Chapters
        @GetMapping("/moderation/chapters")
        public ResponseEntity<Page<ChapterResponse>> getChaptersForModeration(
                        @PageableDefault(size = 20) Pageable pageable) {
                try {
                        Page<ChapterResponse> chapters = chapterService.getChaptersForModeration(pageable);
                        return ResponseEntity.ok(chapters);
                } catch (Exception e) {
                        log.error("Error getting chapters for moderation", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/moderation/chapters/{chapterId}")
        public ResponseEntity<ChapterResponse> moderateChapter(
                        @PathVariable UUID chapterId,
                        @RequestParam String notes,
                        @RequestParam boolean approved,
                        HttpServletRequest httpRequest) {
                try {
                        UUID moderatorId = getCurrentUserId(httpRequest);
                        ChapterResponse chapter = chapterService.moderateChapter(chapterId, notes, approved,
                                        moderatorId);
                        return ResponseEntity.ok(chapter);
                } catch (IllegalArgumentException e) {
                        log.error("Error moderating chapter: {}", e.getMessage());
                        return ResponseEntity.badRequest().build();
                } catch (Exception e) {
                        log.error("Unexpected error moderating chapter", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        // Moderation Queue - Stories
        @GetMapping("/moderation/stories")
        public ResponseEntity<Page<StoryResponse>> getStoriesForModeration(
                        @PageableDefault(size = 20) Pageable pageable) {
                try {
                        // TODO: Implement story moderation service method
                        return ResponseEntity.ok(Page.empty());
                } catch (Exception e) {
                        log.error("Error getting stories for moderation", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/moderation/stories/{storyId}")
        public ResponseEntity<StoryResponse> moderateStory(
                        @PathVariable UUID storyId,
                        @RequestParam String notes,
                        @RequestParam boolean approved,
                        HttpServletRequest httpRequest) {
                try {
                        UUID moderatorId = getCurrentUserId(httpRequest);
                        // TODO: Implement story moderation service method
                        return ResponseEntity.ok().build();
                } catch (IllegalArgumentException e) {
                        log.error("Error moderating story: {}", e.getMessage());
                        return ResponseEntity.badRequest().build();
                } catch (Exception e) {
                        log.error("Unexpected error moderating story", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        // User Management
        @GetMapping("/users")
        public ResponseEntity<Map<String, Object>> getUsers(
                        @PageableDefault(size = 20) Pageable pageable,
                        @RequestParam(required = false) String search,
                        @RequestParam(required = false) String status) {
                try {
                        // TODO: Implement user management endpoints
                        Map<String, Object> result = new HashMap<>();
                        result.put("users", Page.empty());
                        result.put("totalUsers", 0);
                        return ResponseEntity.ok(result);
                } catch (Exception e) {
                        log.error("Error getting users", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/users/{userId}/suspend")
        public ResponseEntity<Void> suspendUser(
                        @PathVariable UUID userId,
                        @RequestParam String reason,
                        HttpServletRequest httpRequest) {
                try {
                        UUID adminId = getCurrentUserId(httpRequest);
                        // TODO: Implement user suspension
                        log.info("User {} suspended by admin {}: {}", userId, adminId, reason);
                        return ResponseEntity.ok().build();
                } catch (Exception e) {
                        log.error("Error suspending user", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/users/{userId}/unsuspend")
        public ResponseEntity<Void> unsuspendUser(
                        @PathVariable UUID userId,
                        HttpServletRequest httpRequest) {
                try {
                        UUID adminId = getCurrentUserId(httpRequest);
                        // TODO: Implement user unsuspension
                        log.info("User {} unsuspended by admin {}", userId, adminId);
                        return ResponseEntity.ok().build();
                } catch (Exception e) {
                        log.error("Error unsuspending user", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        // Content Management
        @GetMapping("/content/reports")
        public ResponseEntity<Map<String, Object>> getContentReports(
                        @PageableDefault(size = 20) Pageable pageable) {
                try {
                        // TODO: Implement content reporting system
                        Map<String, Object> result = new HashMap<>();
                        result.put("reports", Page.empty());
                        result.put("totalReports", 0);
                        return ResponseEntity.ok(result);
                } catch (Exception e) {
                        log.error("Error getting content reports", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/content/featured")
        public ResponseEntity<Void> setFeaturedContent(
                        @RequestParam String contentType, // "story" or "chapter"
                        @RequestParam UUID contentId,
                        @RequestParam boolean featured) {
                try {
                        // TODO: Implement featured content management
                        log.info("Setting {} {} as featured: {}", contentType, contentId, featured);
                        return ResponseEntity.ok().build();
                } catch (Exception e) {
                        log.error("Error setting featured content", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        // Utility method to get current user ID
        private UUID getCurrentUserId(HttpServletRequest request) {
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        return jwtUtil.getUserIdFromToken(token);
                }
                throw new IllegalArgumentException("No valid authorization token found");
        }
}