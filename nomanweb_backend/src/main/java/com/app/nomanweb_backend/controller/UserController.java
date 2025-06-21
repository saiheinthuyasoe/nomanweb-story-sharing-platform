package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.entity.UserFollow;
import com.app.nomanweb_backend.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = { "http://localhost:3000", "https://localhost:3000" })
public class UserController {

    private final UserService userService;

    // Get current user's statistics
    @GetMapping("/me/stats")
    public ResponseEntity<Map<String, Object>> getMyStats(HttpServletRequest request) {
        try {
            UUID userId = getCurrentUserId(request);
            Map<String, Object> stats = userService.getUserStats(userId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting user stats", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get user statistics by ID
    @GetMapping("/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getUserStats(@PathVariable UUID userId) {
        try {
            Map<String, Object> stats = userService.getUserStats(userId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting user stats for user {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get user's followers
    @GetMapping("/{userId}/followers")
    public ResponseEntity<Page<Map<String, Object>>> getFollowers(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Map<String, Object>> followers = userService.getFollowers(userId, pageable);
            return ResponseEntity.ok(followers);
        } catch (Exception e) {
            log.error("Error getting followers for user {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get user's following
    @GetMapping("/{userId}/following")
    public ResponseEntity<Page<Map<String, Object>>> getFollowing(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Map<String, Object>> following = userService.getFollowing(userId, pageable);
            return ResponseEntity.ok(following);
        } catch (Exception e) {
            log.error("Error getting following for user {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Follow a user
    @PostMapping("/{userId}/follow")
    public ResponseEntity<Void> followUser(@PathVariable UUID userId, HttpServletRequest request) {
        try {
            UUID currentUserId = getCurrentUserId(request);
            userService.followUser(currentUserId, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error following user {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Unfollow a user
    @DeleteMapping("/{userId}/follow")
    public ResponseEntity<Void> unfollowUser(@PathVariable UUID userId, HttpServletRequest request) {
        try {
            UUID currentUserId = getCurrentUserId(request);
            userService.unfollowUser(currentUserId, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error unfollowing user {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Check if current user follows another user
    @GetMapping("/{userId}/is-following")
    public ResponseEntity<Map<String, Boolean>> isFollowing(@PathVariable UUID userId, HttpServletRequest request) {
        try {
            UUID currentUserId = getCurrentUserId(request);
            boolean isFollowing = userService.isFollowing(currentUserId, userId);
            Map<String, Boolean> response = new HashMap<>();
            response.put("isFollowing", isFollowing);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error checking if following user {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Get user profile by ID (public profile info)
    @GetMapping("/{userId}/profile")
    public ResponseEntity<Map<String, Object>> getUserProfile(@PathVariable UUID userId) {
        try {
            Map<String, Object> profile = userService.getUserProfile(userId);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("Error getting user profile for user {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Utility method to get current user ID from JWT token
    private UUID getCurrentUserId(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getPrincipal().equals("anonymousUser")) {
            return UUID.fromString(authentication.getName());
        }
        throw new IllegalArgumentException("No valid authentication found");
    }
}