package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.chapter.ChapterResponse;
import com.app.nomanweb_backend.dto.story.StoryResponse;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.FeaturedContent;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.ChapterRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.service.ChapterModerationProcessor;
import com.app.nomanweb_backend.service.ChapterService;
import com.app.nomanweb_backend.service.FeaturedContentService;
import com.app.nomanweb_backend.service.ProfileImageDownloadService;
import com.app.nomanweb_backend.service.StoryService;
import com.app.nomanweb_backend.service.ViewMigrationService;
import com.app.nomanweb_backend.service.WithdrawService;
import com.app.nomanweb_backend.service.StripeWithdrawService;
import com.app.nomanweb_backend.service.WithdrawalScheduledService;
import com.app.nomanweb_backend.dto.withdraw.WithdrawResponse;
import com.app.nomanweb_backend.entity.Withdraw;
import com.app.nomanweb_backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001",
                "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

        private final ChapterModerationProcessor chapterModerationProcessor;
        private final ChapterService chapterService;
        private final StoryService storyService;
        private final FeaturedContentService featuredContentService;
        private final JwtUtil jwtUtil;
        private final StoryRepository storyRepository;
        private final ChapterRepository chapterRepository;
        private final UserRepository userRepository;
        private final ProfileImageDownloadService profileImageDownloadService;
        private final ViewMigrationService viewMigrationService;
        private final WithdrawService withdrawService;
        private final StripeWithdrawService stripeWithdrawService;
        private final WithdrawalScheduledService withdrawalScheduledService;

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

        // User Analytics
        @GetMapping("/dashboard/user-analytics")
        public ResponseEntity<Map<String, Object>> getUserAnalytics() {
                try {
                        Map<String, Object> analytics = new HashMap<>();

                        // Get total users
                        long totalUsers = userRepository.count();

                        // Get active users (users who have logged in within the last 30 days)
                        java.time.LocalDateTime thirtyDaysAgo = java.time.LocalDateTime.now().minusDays(30);
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

                        log.info("User analytics: Total={}, Active={}, New={}, Suspended={}, Verified={}",
                                        totalUsers, activeUsers, newUsers, suspendedUsers, verifiedUsers);

                        return ResponseEntity.ok(analytics);
                } catch (Exception e) {
                        log.error("Error getting user analytics", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        // Monthly Time-Series Data
        @GetMapping("/dashboard/monthly-data")
        public ResponseEntity<Map<String, Object>> getMonthlyTimeSeriesData() {
                try {
                        Map<String, Object> timeSeriesData = new HashMap<>();
                        
                        // Get last 12 months of data
                        List<Map<String, Object>> userRegistrations = new ArrayList<>();
                        List<Map<String, Object>> revenueData = new ArrayList<>();
                        
                        java.time.LocalDateTime now = java.time.LocalDateTime.now();
                        
                        for (int i = 11; i >= 0; i--) {
                                java.time.LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
                                java.time.LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);
                                
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
                        
                        return ResponseEntity.ok(timeSeriesData);
                } catch (Exception e) {
                        log.error("Error getting monthly time-series data", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @GetMapping("/dashboard/content-analytics")
        public ResponseEntity<Map<String, Object>> getContentAnalytics() {
                try {
                        Map<String, Object> contentAnalytics = new HashMap<>();
                        
                        // Get total views across all published stories
                        List<Story> publishedStories = storyRepository.findAll().stream()
                                .filter(story -> story.getPublishStatus() == Story.PublishStatus.PUBLISHED)
                                .collect(Collectors.toList());
                        
                        long totalViews = publishedStories.stream()
                                .mapToLong(story -> story.getTotalViews() != null ? story.getTotalViews() : 0L)
                                .sum();
                        
                        // Get total likes across all published stories
                        long totalLikes = publishedStories.stream()
                                .mapToLong(story -> story.getTotalLikes() != null ? story.getTotalLikes() : 0L)
                                .sum();
                        
                        // Get recent activity (stories updated in last 7 days)
                        java.time.LocalDateTime weekAgo = java.time.LocalDateTime.now().minusDays(7);
                        long recentActivity = publishedStories.stream()
                                .filter(story -> story.getUpdatedAt() != null && story.getUpdatedAt().isAfter(weekAgo))
                                .count();
                        
                        // Calculate engagement metrics
                        double avgViewsPerStory = publishedStories.size() > 0 ? (double) totalViews / publishedStories.size() : 0;
                        double avgLikesPerStory = publishedStories.size() > 0 ? (double) totalLikes / publishedStories.size() : 0;
                        double engagementRate = totalViews > 0 ? (double) totalLikes / totalViews * 100 : 0;
                        
                        contentAnalytics.put("totalViews", totalViews);
                        contentAnalytics.put("totalLikes", totalLikes);
                        contentAnalytics.put("recentActivity", recentActivity);
                        contentAnalytics.put("avgViewsPerStory", Math.round(avgViewsPerStory));
                        contentAnalytics.put("avgLikesPerStory", Math.round(avgLikesPerStory));
                        contentAnalytics.put("engagementRate", Math.round(engagementRate * 100.0) / 100.0);
                        contentAnalytics.put("totalPublishedStories", publishedStories.size());
                        
                        return ResponseEntity.ok(contentAnalytics);
                } catch (Exception e) {
                        log.error("Error getting content analytics", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        // Queue Status and Processing Metrics
        @GetMapping("/moderation/queue/status")
        public ResponseEntity<Map<String, Object>> getQueueStatus() {
                try {
                        Map<String, Object> status = chapterModerationProcessor.getProcessorStatus();
                        return ResponseEntity.ok(status);
                } catch (Exception e) {
                        log.error("Error getting queue status", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        // AI Moderation Control
        @PostMapping("/moderation/ai/start")
        public ResponseEntity<Map<String, Object>> startAiModeration() {
                try {
                        boolean started = chapterModerationProcessor.startAiModeration();
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", started);
                        response.put("message", started ? "AI moderation started successfully"
                                        : "AI moderation is already running");
                        return ResponseEntity.ok(response);
                } catch (Exception e) {
                        log.error("Error starting AI moderation", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/moderation/ai/stop")
        public ResponseEntity<Map<String, Object>> stopAiModeration() {
                try {
                        boolean stopped = chapterModerationProcessor.stopAiModeration();
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", stopped);
                        response.put("message", stopped ? "AI moderation stopped successfully"
                                        : "AI moderation was not running");
                        return ResponseEntity.ok(response);
                } catch (Exception e) {
                        log.error("Error stopping AI moderation", e);
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
                        log.info("Admin getting users - page: {}, search: {}, status: {}",
                                        pageable.getPageNumber(), search, status);

                        // Get all users from repository
                        List<User> allUsers = userRepository.findAll();

                        // Apply filters
                        List<User> filteredUsers = allUsers.stream()
                                        .filter(user -> {
                                                boolean matchesSearch = search == null || search.trim().isEmpty() ||
                                                                user.getUsername().toLowerCase()
                                                                                .contains(search.toLowerCase())
                                                                ||
                                                                user.getEmail().toLowerCase()
                                                                                .contains(search.toLowerCase());

                                                boolean matchesStatus = status == null || status.trim().isEmpty() ||
                                                                (user.getStatus() != null && user.getStatus().toString()
                                                                                .toLowerCase()
                                                                                .equals(status.toLowerCase()));

                                                return matchesSearch && matchesStatus;
                                        })
                                        .collect(Collectors.toList());

                        // Calculate pagination
                        int start = (int) pageable.getOffset();
                        int end = Math.min(start + pageable.getPageSize(), filteredUsers.size());
                        List<User> pageUsers = start < filteredUsers.size() ? filteredUsers.subList(start, end)
                                        : new ArrayList<>();

                        // Convert to response format
                        List<Map<String, Object>> userResponses = pageUsers.stream()
                                        .map(user -> {
                                                Map<String, Object> userMap = new HashMap<>();
                                                userMap.put("id", user.getId().toString());
                                                userMap.put("username", user.getUsername());
                                                userMap.put("email", user.getEmail());
                                                userMap.put("role", user.getRole().toString());
                                                userMap.put("status",
                                                                user.getStatus() != null
                                                                                ? user.getStatus().toString()
                                                                                                .toLowerCase()
                                                                                : "unknown"); // Convert enum to
                                                                                              // lowercase, handle null
                                                userMap.put("createdAt", user.getCreatedAt());
                                                userMap.put("lastLoginAt", user.getLastLoginAt());
                                                userMap.put("emailVerified", user.getEmailVerified());
                                                userMap.put("profileImageUrl", user.getProfileImageUrl());

                                                // Add stats (TODO: get from actual queries)
                                                userMap.put("totalStories", 0);
                                                userMap.put("totalFollowers", 0);
                                                userMap.put("totalFollowing", 0);

                                                return userMap;
                                        })
                                        .collect(Collectors.toList());

                        // Create page object
                        Map<String, Object> usersPage = new HashMap<>();
                        usersPage.put("content", userResponses);
                        usersPage.put("totalElements", filteredUsers.size());
                        usersPage.put("totalPages",
                                        (int) Math.ceil((double) filteredUsers.size() / pageable.getPageSize()));
                        usersPage.put("size", pageable.getPageSize());
                        usersPage.put("number", pageable.getPageNumber());

                        Map<String, Object> result = new HashMap<>();
                        result.put("users", usersPage);
                        result.put("totalUsers", allUsers.size());

                        log.info("Returning {} users out of {} total", userResponses.size(), allUsers.size());
                        return ResponseEntity.ok(result);

                } catch (Exception e) {
                        log.error("Error getting users", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @GetMapping("/users/{userId}")
        public ResponseEntity<Map<String, Object>> getUserDetails(@PathVariable UUID userId) {
                try {
                        log.info("Admin getting user details for userId: {}", userId);

                        // Find user by ID
                        User user = userRepository.findById(userId)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        // Convert to detailed response format
                        Map<String, Object> userDetail = new HashMap<>();
                        userDetail.put("id", user.getId().toString());
                        userDetail.put("username", user.getUsername());
                        userDetail.put("displayName", user.getDisplayName());
                        userDetail.put("email", user.getEmail());
                        userDetail.put("role", user.getRole().toString());
                        userDetail.put("status", user.getStatus() != null ? user.getStatus().toString().toLowerCase()
                                        : "unknown");
                        userDetail.put("createdAt", user.getCreatedAt());
                        userDetail.put("updatedAt", user.getUpdatedAt());
                        userDetail.put("lastLoginAt", user.getLastLoginAt());
                        userDetail.put("lastLoginIp", null); // Field not available in User entity
                        userDetail.put("emailVerified", user.getEmailVerified());
                        userDetail.put("profileImageUrl", user.getProfileImageUrl());
                        userDetail.put("bio", user.getBio());

                        // Additional fields for admin view
                        userDetail.put("coinBalance", user.getCoinBalance());
                        userDetail.put("totalEarnedCoins", user.getTotalEarnedCoins());
                        userDetail.put("lastPasswordChange", user.getLastPasswordChange());
                        userDetail.put("lineUserId", user.getLineUserId());
                        userDetail.put("googleId", user.getGoogleId());

                        // Calculate stats (TODO: get from actual queries)
                        userDetail.put("totalStories", 0);
                        userDetail.put("totalFollowers", 0);
                        userDetail.put("totalFollowing", 0);
                        userDetail.put("totalComments", 0);
                        userDetail.put("reportedCount", 0);

                        log.info("Returning user details for userId: {}", userId);
                        return ResponseEntity.ok(userDetail);

                } catch (RuntimeException e) {
                        log.error("User not found: {}", userId);
                        return ResponseEntity.notFound().build();
                } catch (Exception e) {
                        log.error("Error getting user details", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PutMapping("/users/{userId}")
        public ResponseEntity<Map<String, Object>> updateUser(
                        @PathVariable UUID userId,
                        @RequestBody Map<String, Object> updateData,
                        HttpServletRequest httpRequest) {
                try {
                        log.info("Admin updating user: {}", userId);
                        UUID adminId = getCurrentUserId(httpRequest);

                        // Find user by ID
                        User user = userRepository.findById(userId)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        // Update user fields
                        if (updateData.containsKey("username")) {
                                String username = (String) updateData.get("username");
                                if (username != null && !username.trim().isEmpty()) {
                                        user.setUsername(username.trim());
                                }
                        }

                        if (updateData.containsKey("displayName")) {
                                user.setDisplayName((String) updateData.get("displayName"));
                        }

                        if (updateData.containsKey("email")) {
                                String email = (String) updateData.get("email");
                                if (email != null && !email.trim().isEmpty()) {
                                        user.setEmail(email.trim());
                                }
                        }

                        if (updateData.containsKey("role")) {
                                String roleStr = (String) updateData.get("role");
                                if (roleStr != null) {
                                        user.setRole(User.Role.valueOf(roleStr.toUpperCase()));
                                }
                        }

                        if (updateData.containsKey("status")) {
                                String statusStr = (String) updateData.get("status");
                                if (statusStr != null) {
                                        user.setStatus(User.Status.valueOf(statusStr.toUpperCase()));
                                }
                        }

                        if (updateData.containsKey("bio")) {
                                user.setBio((String) updateData.get("bio"));
                        }

                        if (updateData.containsKey("emailVerified")) {
                                Boolean emailVerified = (Boolean) updateData.get("emailVerified");
                                if (emailVerified != null) {
                                        user.setEmailVerified(emailVerified);
                                }
                        }

                        if (updateData.containsKey("coinBalance")) {
                                Object coinBalanceObj = updateData.get("coinBalance");
                                if (coinBalanceObj != null) {
                                        BigDecimal coinBalance;
                                        if (coinBalanceObj instanceof Number) {
                                                coinBalance = BigDecimal
                                                                .valueOf(((Number) coinBalanceObj).doubleValue());
                                        } else {
                                                coinBalance = new BigDecimal(coinBalanceObj.toString());
                                        }
                                        user.setCoinBalance(coinBalance);
                                }
                        }

                        // Handle password update if provided
                        if (updateData.containsKey("newPassword")) {
                                String newPassword = (String) updateData.get("newPassword");
                                if (newPassword != null && !newPassword.trim().isEmpty()) {
                                        // TODO: Hash password properly using PasswordEncoder
                                        // For now, we'll skip password updates to avoid security issues
                                        log.warn("Password update requested but not implemented for security reasons");
                                }
                        }

                        // Update timestamp
                        user.setUpdatedAt(LocalDateTime.now());

                        // Save user
                        User updatedUser = userRepository.save(user);

                        log.info("User {} updated successfully by admin {}", userId, adminId);

                        // Return success response
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("message", "User updated successfully");
                        response.put("userId", updatedUser.getId().toString());

                        return ResponseEntity.ok(response);

                } catch (RuntimeException e) {
                        log.error("User not found: {}", userId);
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(Map.of("error", "User not found"));
                } catch (Exception e) {
                        log.error("Error updating user", e);
                        return ResponseEntity.internalServerError()
                                        .body(Map.of("error", "Internal server error"));
                }
        }

        @DeleteMapping("/users/{userId}")
        public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable UUID userId) {
                try {
                        log.info("Admin deleting user: {}", userId);

                        // Find user by ID
                        User user = userRepository.findById(userId)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        // Prevent deletion of admin users
                        if (user.getRole() == User.Role.ADMIN) {
                                return ResponseEntity.badRequest()
                                                .body(Map.of("error", "Cannot delete admin users"));
                        }

                        // Delete user
                        userRepository.deleteById(userId);

                        log.info("User {} deleted successfully", userId);
                        return ResponseEntity.ok(Map.of("success", true, "message", "User deleted successfully"));

                } catch (RuntimeException e) {
                        log.error("User not found: {}", userId);
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(Map.of("error", "User not found"));
                } catch (Exception e) {
                        log.error("Error deleting user", e);
                        return ResponseEntity.internalServerError()
                                        .body(Map.of("error", "Internal server error"));
                }
        }

        @GetMapping("/users/{userId}/activity")
        public ResponseEntity<List<Map<String, Object>>> getUserActivityLogs(@PathVariable UUID userId) {
                try {
                        log.info("Admin getting activity logs for userId: {}", userId);

                        // Verify user exists
                        User user = userRepository.findById(userId)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        // TODO: Implement real activity logging system
                        List<Map<String, Object>> activityLogs = new ArrayList<>();

                        log.info("Returning {} activity logs for userId: {}", activityLogs.size(), userId);
                        return ResponseEntity.ok(activityLogs);

                } catch (RuntimeException e) {
                        log.error("User not found: {}", userId);
                        return ResponseEntity.notFound().build();
                } catch (Exception e) {
                        log.error("Error getting user activity logs", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @GetMapping("/users/{userId}/reports")
        public ResponseEntity<List<Map<String, Object>>> getUserReports(@PathVariable UUID userId) {
                try {
                        log.info("Admin getting reports for userId: {}", userId);

                        // Verify user exists
                        User user = userRepository.findById(userId)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        // TODO: Implement real reporting system
                        List<Map<String, Object>> reports = new ArrayList<>();

                        log.info("Returning {} reports for userId: {}", reports.size(), userId);
                        return ResponseEntity.ok(reports);

                } catch (RuntimeException e) {
                        log.error("User not found: {}", userId);
                        return ResponseEntity.notFound().build();
                } catch (Exception e) {
                        log.error("Error getting user reports", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/users/{userId}/suspend")
        public ResponseEntity<Void> suspendUser(
                        @PathVariable UUID userId,
                        @RequestBody Map<String, String> requestBody,
                        HttpServletRequest httpRequest) {
                try {
                        UUID adminId = getCurrentUserId(httpRequest);
                        String reason = requestBody.get("reason");

                        if (reason == null || reason.trim().isEmpty()) {
                                return ResponseEntity.badRequest().build();
                        }

                        // Find and update user status
                        User user = userRepository.findById(userId)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        if (user.getRole() == User.Role.ADMIN) {
                                return ResponseEntity.badRequest().build(); // Cannot suspend admins
                        }

                        user.setStatus(User.Status.SUSPENDED);
                        user.setUpdatedAt(LocalDateTime.now());
                        userRepository.save(user);

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

                        // Find and update user status
                        User user = userRepository.findById(userId)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        if (user.getStatus() != User.Status.SUSPENDED) {
                                return ResponseEntity.badRequest().build(); // User is not suspended
                        }

                        user.setStatus(User.Status.ACTIVE);
                        user.setUpdatedAt(LocalDateTime.now());
                        userRepository.save(user);

                        log.info("User {} unsuspended by admin {}", userId, adminId);
                        return ResponseEntity.ok().build();
                } catch (Exception e) {
                        log.error("Error unsuspending user", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/users/{userId}/ban")
        public ResponseEntity<Void> banUser(
                        @PathVariable UUID userId,
                        @RequestBody Map<String, String> requestBody,
                        HttpServletRequest httpRequest) {
                try {
                        UUID adminId = getCurrentUserId(httpRequest);
                        String reason = requestBody.get("reason");

                        if (reason == null || reason.trim().isEmpty()) {
                                return ResponseEntity.badRequest().build();
                        }

                        // Find and update user status
                        User user = userRepository.findById(userId)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        if (user.getRole() == User.Role.ADMIN) {
                                return ResponseEntity.badRequest().build(); // Cannot ban admins
                        }

                        user.setStatus(User.Status.BANNED);
                        user.setUpdatedAt(LocalDateTime.now());
                        userRepository.save(user);

                        log.info("User {} banned by admin {}: {}", userId, adminId, reason);
                        return ResponseEntity.ok().build();
                } catch (Exception e) {
                        log.error("Error banning user", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/users/{userId}/unban")
        public ResponseEntity<Void> unbanUser(
                        @PathVariable UUID userId,
                        HttpServletRequest httpRequest) {
                try {
                        UUID adminId = getCurrentUserId(httpRequest);

                        // Find and update user status
                        User user = userRepository.findById(userId)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        if (user.getStatus() != User.Status.BANNED) {
                                return ResponseEntity.badRequest().build(); // User is not banned
                        }

                        user.setStatus(User.Status.ACTIVE);
                        user.setUpdatedAt(LocalDateTime.now());
                        userRepository.save(user);

                        log.info("User {} unbanned by admin {}", userId, adminId);
                        return ResponseEntity.ok().build();
                } catch (Exception e) {
                        log.error("Error unbanning user", e);
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

        @PostMapping("/migrate-oauth-images")
        public ResponseEntity<Map<String, Object>> migrateOAuthImages() {
                try {
                        log.info("Starting OAuth profile image migration...");

                        // Find all users with external OAuth profile images
                        List<User> usersWithExternalImages = userRepository.findAll().stream()
                                        .filter(user -> user.getProfileImageUrl() != null &&
                                                        (user.getProfileImageUrl().contains("googleusercontent.com") ||
                                                                        user.getProfileImageUrl().contains(
                                                                                        "profile-cdn.line-scdn.net")
                                                                        ||
                                                                        user.getProfileImageUrl().contains(
                                                                                        "graph.facebook.com")))
                                        .collect(Collectors.toList());

                        log.info("Found {} users with external OAuth profile images", usersWithExternalImages.size());

                        int successCount = 0;
                        int failureCount = 0;

                        for (User user : usersWithExternalImages) {
                                try {
                                        String externalUrl = user.getProfileImageUrl();
                                        String provider = "";

                                        if (externalUrl.contains("googleusercontent.com")) {
                                                provider = "google";
                                        } else if (externalUrl.contains("profile-cdn.line-scdn.net")) {
                                                provider = "line";
                                        } else if (externalUrl.contains("graph.facebook.com")) {
                                                provider = "facebook";
                                        }

                                        log.info("Migrating {} profile image for user {}: {}", provider, user.getId(),
                                                        externalUrl);

                                        String cloudinaryUrl = profileImageDownloadService
                                                        .downloadAndStoreProfileImage(externalUrl, provider);

                                        if (cloudinaryUrl != null && !cloudinaryUrl.equals(externalUrl)) {
                                                user.setProfileImageUrl(cloudinaryUrl);
                                                userRepository.save(user);
                                                successCount++;
                                                log.info("Successfully migrated profile image for user {}",
                                                                user.getId());
                                        } else {
                                                failureCount++;
                                                log.warn("Failed to migrate profile image for user {}", user.getId());
                                        }

                                        // Add small delay to avoid overwhelming external services
                                        Thread.sleep(1000);

                                } catch (Exception e) {
                                        failureCount++;
                                        log.error("Error migrating profile image for user {}: {}", user.getId(),
                                                        e.getMessage());
                                }
                        }

                        Map<String, Object> result = new HashMap<>();
                        result.put("totalUsers", usersWithExternalImages.size());
                        result.put("successCount", successCount);
                        result.put("failureCount", failureCount);
                        result.put("message", "OAuth profile image migration completed");

                        log.info("OAuth profile image migration completed. Success: {}, Failures: {}", successCount,
                                        failureCount);

                        return ResponseEntity.ok(result);

                } catch (Exception e) {
                        log.error("Error during OAuth profile image migration: {}", e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(Map.of("error", "Migration failed: " + e.getMessage()));
                }
        }

        @GetMapping("/check-oauth-images")
        public ResponseEntity<Map<String, Object>> checkOAuthImages() {
                try {
                        // Find all users with external OAuth profile images
                        List<User> usersWithExternalImages = userRepository.findAll().stream()
                                        .filter(user -> user.getProfileImageUrl() != null &&
                                                        (user.getProfileImageUrl().contains("googleusercontent.com") ||
                                                                        user.getProfileImageUrl().contains(
                                                                                        "profile-cdn.line-scdn.net")
                                                                        ||
                                                                        user.getProfileImageUrl().contains(
                                                                                        "graph.facebook.com")))
                                        .collect(Collectors.toList());

                        // Count by provider
                        long googleImages = usersWithExternalImages.stream()
                                        .filter(user -> user.getProfileImageUrl().contains("googleusercontent.com"))
                                        .count();

                        long lineImages = usersWithExternalImages.stream()
                                        .filter(user -> user.getProfileImageUrl().contains("profile-cdn.line-scdn.net"))
                                        .count();

                        long facebookImages = usersWithExternalImages.stream()
                                        .filter(user -> user.getProfileImageUrl().contains("graph.facebook.com"))
                                        .count();

                        Map<String, Object> result = new HashMap<>();
                        result.put("totalExternalImages", usersWithExternalImages.size());
                        result.put("googleImages", googleImages);
                        result.put("lineImages", lineImages);
                        result.put("facebookImages", facebookImages);
                        result.put("needsMigration", usersWithExternalImages.size() > 0);

                        return ResponseEntity.ok(result);

                } catch (Exception e) {
                        log.error("Error checking OAuth profile images: {}", e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(Map.of("error", "Failed to check OAuth images: " + e.getMessage()));
                }
        }

        @PostMapping("/migrate-views")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<?> migrateViews() {
                try {
                        ViewMigrationService.MigrationResult result = viewMigrationService.migrateExistingViews();
                        return ResponseEntity.ok(Map.of(
                                        "success", true,
                                        "chaptersMigrated", result.getChaptersMigrated(),
                                        "storiesMigrated", result.getStoriesMigrated(),
                                        "message", result.getMessage()));
                } catch (Exception e) {
                        log.error("Error during view migration: {}", e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(Map.of("error", "Migration failed: " + e.getMessage()));
                }
        }

        // Featured Content Management Endpoints

        @GetMapping("/featured-content/{sectionType}")
        public ResponseEntity<Page<FeaturedContent>> getFeaturedContent(
                        @PathVariable String sectionType,
                        @PageableDefault(size = 20) Pageable pageable) {
                try {
                        FeaturedContent.SectionType section = FeaturedContent.SectionType
                                        .valueOf(sectionType.toUpperCase());
                        Page<FeaturedContent> featuredContent = featuredContentService.getAllFeaturedContent(section,
                                        pageable.getPageNumber(), pageable.getPageSize());
                        return ResponseEntity.ok(featuredContent);
                } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().build();
                } catch (Exception e) {
                        log.error("Error getting featured content for section: {}", sectionType, e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/featured-content/{sectionType}/add/{storyId}")
        public ResponseEntity<FeaturedContent> addToFeaturedSection(
                        @PathVariable String sectionType,
                        @PathVariable UUID storyId,
                        @RequestBody(required = false) Map<String, Object> requestBody,
                        HttpServletRequest request) {
                try {
                        UUID adminId = getCurrentUserId(request);
                        User admin = userRepository.findById(adminId)
                                        .orElseThrow(() -> new RuntimeException("Admin user not found"));

                        FeaturedContent.SectionType section = FeaturedContent.SectionType
                                        .valueOf(sectionType.toUpperCase());

                        // Get duration from request body (0 means permanent)
                        Integer duration = 0;
                        if (requestBody != null && requestBody.containsKey("duration")) {
                                Object durationObj = requestBody.get("duration");
                                if (durationObj instanceof Number) {
                                        duration = ((Number) durationObj).intValue();
                                } else if (durationObj instanceof String) {
                                        duration = Integer.parseInt((String) durationObj);
                                }
                        }

                        FeaturedContent featuredContent = featuredContentService.addToFeaturedSection(storyId, section,
                                        admin, duration);
                        return ResponseEntity.ok(featuredContent);
                } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().build();
                } catch (RuntimeException e) {
                        return ResponseEntity.badRequest().body(null);
                } catch (Exception e) {
                        log.error("Error adding story to featured section: {}", sectionType, e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @DeleteMapping("/featured-content/{featuredContentId}")
        public ResponseEntity<Void> removeFromFeaturedSection(@PathVariable UUID featuredContentId) {
                try {
                        featuredContentService.removeFromFeaturedSection(featuredContentId);
                        return ResponseEntity.ok().build();
                } catch (RuntimeException e) {
                        return ResponseEntity.notFound().build();
                } catch (Exception e) {
                        log.error("Error removing featured content: {}", featuredContentId, e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PutMapping("/featured-content/{featuredContentId}/order")
        public ResponseEntity<Void> updateDisplayOrder(
                        @PathVariable UUID featuredContentId,
                        @RequestParam Integer newOrder) {
                try {
                        featuredContentService.updateDisplayOrder(featuredContentId, newOrder);
                        return ResponseEntity.ok().build();
                } catch (RuntimeException e) {
                        return ResponseEntity.notFound().build();
                } catch (Exception e) {
                        log.error("Error updating display order for featured content: {}", featuredContentId, e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PutMapping("/featured-content/{featuredContentId}/duration")
        public ResponseEntity<Void> setFeaturedDuration(
                        @PathVariable UUID featuredContentId,
                        @RequestParam String startDate,
                        @RequestParam(required = false) String endDate) {
                try {
                        LocalDateTime start = LocalDateTime.parse(startDate);
                        LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : null;
                        featuredContentService.setFeaturedDuration(featuredContentId, start, end);
                        return ResponseEntity.ok().build();
                } catch (RuntimeException e) {
                        return ResponseEntity.notFound().build();
                } catch (Exception e) {
                        log.error("Error setting featured duration: {}", featuredContentId, e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PutMapping("/featured-content/{featuredContentId}/toggle")
        public ResponseEntity<FeaturedContent> toggleFeaturedContentStatus(@PathVariable UUID featuredContentId) {
                try {
                        FeaturedContent featuredContent = featuredContentService.toggleActiveStatus(featuredContentId);
                        return ResponseEntity.ok(featuredContent);
                } catch (RuntimeException e) {
                        return ResponseEntity.notFound().build();
                } catch (Exception e) {
                        log.error("Error toggling featured content status: {}", featuredContentId, e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/stories/{storyId}/toggle-featured")
        public ResponseEntity<Void> toggleStoryFeaturedStatus(@PathVariable UUID storyId) {
                try {
                        featuredContentService.toggleStoryFeaturedStatus(storyId);
                        return ResponseEntity.ok().build();
                } catch (RuntimeException e) {
                        return ResponseEntity.notFound().build();
                } catch (Exception e) {
                        log.error("Error toggling story featured status: {}", storyId, e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @GetMapping("/featured-content/stats")
        public ResponseEntity<Map<String, Object>> getAllFeaturedContentStats() {
                try {
                        log.debug("Starting getAllFeaturedContentStats");
                        Map<String, Object> stats = new HashMap<>();
                        Map<String, Long> sectionCounts = new HashMap<>();

                        long totalActive = 0;
                        long totalExpired = 0;

                        for (FeaturedContent.SectionType section : FeaturedContent.SectionType.values()) {
                                log.debug("Processing section: {}", section);
                                long activeCount = featuredContentService.getActiveFeaturedCount(section);
                                log.debug("Active count for {}: {}", section, activeCount);
                                sectionCounts.put(section.name(), activeCount);
                                totalActive += activeCount;
                        }

                        log.debug("Getting expired content");
                        List<FeaturedContent> expiredContent = featuredContentService.getExpiredFeaturedContent();
                        totalExpired = expiredContent.size();
                        log.debug("Expired content count: {}", totalExpired);

                        stats.put("totalActive", totalActive);
                        stats.put("totalExpired", totalExpired);
                        stats.put("sectionCounts", sectionCounts);

                        log.debug("Returning stats: {}", stats);
                        return ResponseEntity.ok(stats);
                } catch (Exception e) {
                        log.error("Error getting featured content stats", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @GetMapping("/featured-content/{sectionType}/stats")
        public ResponseEntity<Map<String, Object>> getFeaturedContentStats(@PathVariable String sectionType) {
                try {
                        FeaturedContent.SectionType section = FeaturedContent.SectionType
                                        .valueOf(sectionType.toUpperCase());
                        long activeCount = featuredContentService.getActiveFeaturedCount(section);

                        Map<String, Object> stats = new HashMap<>();
                        stats.put("activeCount", activeCount);
                        stats.put("sectionType", section.name());

                        return ResponseEntity.ok(stats);
                } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().build();
                } catch (Exception e) {
                        log.error("Error getting featured content stats for section: {}", sectionType, e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/featured-content/cleanup-expired")
        public ResponseEntity<Map<String, Object>> cleanupExpiredContent() {
                try {
                        List<FeaturedContent> expiredContent = featuredContentService.getExpiredFeaturedContent();
                        int expiredCount = expiredContent.size();

                        featuredContentService.deactivateExpiredContent();

                        Map<String, Object> result = new HashMap<>();
                        result.put("deactivatedCount", expiredCount);
                        result.put("message", "Expired featured content has been deactivated");

                        return ResponseEntity.ok(result);
                } catch (Exception e) {
                        log.error("Error cleaning up expired featured content", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        // Withdrawal Management Endpoints
        @GetMapping("/withdrawals")
        public ResponseEntity<Page<WithdrawResponse>> getAllWithdrawals(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size,
                        @RequestParam(required = false) String status) {
                try {
                        Withdraw.WithdrawStatus withdrawStatus = null;
                        if (status != null && !status.isEmpty()) {
                                withdrawStatus = Withdraw.WithdrawStatus.valueOf(status.toUpperCase());
                        }

                        Page<WithdrawResponse> withdrawals = withdrawService.getAllWithdrawals(page, size,
                                        withdrawStatus);
                        return ResponseEntity.ok(withdrawals);
                } catch (IllegalArgumentException e) {
                        log.error("Invalid withdrawal status: {}", status);
                        return ResponseEntity.badRequest().build();
                } catch (Exception e) {
                        log.error("Error getting withdrawals", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/withdrawals/{withdrawId}/process")
        public ResponseEntity<WithdrawResponse> processWithdrawal(@PathVariable UUID withdrawId) {
                try {
                        log.info("Admin processing withdrawal: {}", withdrawId);
                        WithdrawResponse response = withdrawService.processWithdraw(withdrawId);
                        return ResponseEntity.ok(response);
                } catch (RuntimeException e) {
                        log.error("Error processing withdrawal {}: {}", withdrawId, e.getMessage());
                        return ResponseEntity.badRequest().body(null);
                } catch (Exception e) {
                        log.error("Unexpected error processing withdrawal {}", withdrawId, e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/withdrawals/{withdrawId}/reject")
        public ResponseEntity<WithdrawResponse> rejectWithdrawal(
                        @PathVariable UUID withdrawId,
                        @RequestParam String reason) {
                try {
                        log.info("Admin rejecting withdrawal: {} with reason: {}", withdrawId, reason);
                        WithdrawResponse response = withdrawService.rejectWithdraw(withdrawId, reason);
                        return ResponseEntity.ok(response);
                } catch (RuntimeException e) {
                        log.error("Error rejecting withdrawal {}: {}", withdrawId, e.getMessage());
                        return ResponseEntity.badRequest().body(null);
                } catch (Exception e) {
                        log.error("Unexpected error rejecting withdrawal {}", withdrawId, e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @GetMapping("/withdrawals/stats")
        public ResponseEntity<Map<String, Object>> getWithdrawalStats(
                        @RequestParam(required = false) String startDate,
                        @RequestParam(required = false) String endDate) {
                try {
                        LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate)
                                        : LocalDateTime.now().minusDays(30);
                        LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : LocalDateTime.now();

                        var stats = withdrawService.getWithdrawStats(start, end);

                        Map<String, Object> response = new HashMap<>();
                        response.put("totalRequests", stats.getTotalRequests());
                        response.put("totalAmount", stats.getTotalAmount());
                        response.put("pendingCount", stats.getPendingCount());
                        response.put("processedCount", stats.getProcessedCount());
                        response.put("rejectedCount", stats.getRejectedCount());

                        return ResponseEntity.ok(response);
                } catch (Exception e) {
                        log.error("Error getting withdrawal stats", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @GetMapping("/stripe/simulation-info")
        public ResponseEntity<Map<String, Object>> getStripeSimulationInfo() {
                try {
                        Map<String, Object> info = stripeWithdrawService.getSimulationInfo();
                        return ResponseEntity.ok(info);
                } catch (Exception e) {
                        log.error("Error getting Stripe simulation info", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/stripe/test-withdrawal")
        public ResponseEntity<Map<String, Object>> testStripeWithdrawal(
                        @RequestParam BigDecimal amount,
                        @RequestParam(defaultValue = "Test Bank") String bankName) {
                try {
                        // Create a test withdrawal object
                        Withdraw testWithdraw = new Withdraw();
                        testWithdraw.setId(UUID.randomUUID());
                        testWithdraw.setAmount(amount);
                        testWithdraw.setBankName(bankName);
                        testWithdraw.setAccountHolderName("Test User");
                        testWithdraw.setAccountNumber("****1234");
                        testWithdraw.setRoutingNumber("123456789");

                        // Create a test user
                        User testUser = new User();
                        testUser.setId(UUID.randomUUID());
                        testUser.setEmail("test@example.com");
                        testWithdraw.setUser(testUser);

                        long startTime = System.currentTimeMillis();
                        String transferId = stripeWithdrawService.processWithdrawal(testWithdraw);
                        long processingTime = System.currentTimeMillis() - startTime;

                        Map<String, Object> result = new HashMap<>();
                        result.put("success", true);
                        result.put("transferId", transferId);
                        result.put("processingTimeMs", processingTime);
                        result.put("simulationMode", stripeWithdrawService.isSimulationMode());
                        result.put("testAmount", amount);

                        return ResponseEntity.ok(result);
                } catch (Exception e) {
                        log.error("Error testing Stripe withdrawal", e);
                        Map<String, Object> result = new HashMap<>();
                        result.put("success", false);
                        result.put("error", e.getMessage());
                        result.put("simulationMode", stripeWithdrawService.isSimulationMode());
                        return ResponseEntity.ok(result);
                }
        }

        @GetMapping("/withdrawals/auto-processing-stats")
        public ResponseEntity<Map<String, Object>> getAutoProcessingStats() {
                try {
                        var stats = withdrawalScheduledService.getAutoProcessingStats();

                        Map<String, Object> response = new HashMap<>();
                        response.put("autoProcessedLast24h", stats.getAutoProcessedLast24h());
                        response.put("currentPending", stats.getCurrentPending());
                        response.put("currentProcessing", stats.getCurrentProcessing());
                        response.put("simulationMode", stripeWithdrawService.isSimulationMode());

                        return ResponseEntity.ok(response);
                } catch (Exception e) {
                        log.error("Error getting auto-processing stats", e);
                        return ResponseEntity.internalServerError().build();
                }
        }

        @PostMapping("/withdrawals/trigger-auto-processing")
        public ResponseEntity<Map<String, String>> triggerAutoProcessing() {
                try {
                        // Manually trigger the scheduled processing for testing
                        withdrawalScheduledService.processAutomaticWithdrawals();

                        Map<String, String> response = new HashMap<>();
                        response.put("message", "Auto-processing triggered successfully");
                        response.put("timestamp", LocalDateTime.now().toString());

                        return ResponseEntity.ok(response);
                } catch (Exception e) {
                        log.error("Error triggering auto-processing", e);
                        Map<String, String> response = new HashMap<>();
                        response.put("error", "Failed to trigger auto-processing: " + e.getMessage());
                        return ResponseEntity.internalServerError().body(response);
                }
        }

        // Utility method to get current user ID
        private UUID getCurrentUserId(HttpServletRequest request) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.isAuthenticated() &&
                                !authentication.getPrincipal().equals("anonymousUser")) {
                        return UUID.fromString(authentication.getName());
                }
                throw new IllegalArgumentException("No valid authentication found");
        }
}