package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.rating.RateStoryRequest;
import com.app.nomanweb_backend.dto.rating.StoryRatingResponse;
import com.app.nomanweb_backend.dto.rating.StoryRatingStatsResponse;
import com.app.nomanweb_backend.entity.StoryRating;
import com.app.nomanweb_backend.service.StoryRatingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/stories/{storyId}/ratings")
@RequiredArgsConstructor
@Tag(name = "Story Ratings", description = "Story rating management operations")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
public class StoryRatingController {

    private final StoryRatingService storyRatingService;

    @PostMapping
    @Operation(summary = "Rate a story")
    public ResponseEntity<Map<String, Object>> rateStory(
            @PathVariable UUID storyId,
            @Valid @RequestBody RateStoryRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() ||
                authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(401).build();
        }

        String userIdStr = authentication.getName();
        UUID userId = UUID.fromString(userIdStr);

        try {
            StoryRating rating;
            boolean isUpdate = storyRatingService.hasUserRated(userId, storyId);
            
            if (isUpdate) {
                rating = storyRatingService.updateRating(userId, storyId, request.getRating());
            } else {
                rating = storyRatingService.rateStory(userId, storyId, request.getRating());
            }

            // Get updated stats
            StoryRatingStatsResponse stats = storyRatingService.getStoryRatingStats(storyId, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", isUpdate ? "Rating updated successfully" : "Rating submitted successfully");
            response.put("userRating", rating.getRating());
            response.put("stats", stats);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @DeleteMapping
    @Operation(summary = "Delete user's rating for a story")
    public ResponseEntity<Map<String, Object>> deleteRating(@PathVariable UUID storyId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() ||
                authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(401).build();
        }

        String userIdStr = authentication.getName();
        UUID userId = UUID.fromString(userIdStr);

        try {
            storyRatingService.deleteRating(userId, storyId);
            
            // Get updated stats
            StoryRatingStatsResponse stats = storyRatingService.getStoryRatingStats(storyId, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Rating deleted successfully");
            response.put("stats", stats);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/stats")
    @Operation(summary = "Get rating statistics for a story")
    public ResponseEntity<StoryRatingStatsResponse> getStoryRatingStats(
            @PathVariable UUID storyId) {
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UUID currentUserId = null;
        
        if (authentication != null && authentication.isAuthenticated() &&
                !(authentication instanceof AnonymousAuthenticationToken)) {
            currentUserId = UUID.fromString(authentication.getName());
        }

        try {
            StoryRatingStatsResponse stats = storyRatingService.getStoryRatingStats(storyId, currentUserId);
            return ResponseEntity.ok(stats);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    @Operation(summary = "Get all ratings for a story")
    public ResponseEntity<Page<StoryRatingResponse>> getStoryRatings(
            @PathVariable UUID storyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        try {
            Page<StoryRatingResponse> ratings = storyRatingService.getStoryRatings(storyId, pageable);
            return ResponseEntity.ok(ratings);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user")
    @Operation(summary = "Get current user's rating for the story")
    public ResponseEntity<Map<String, Object>> getUserRating(@PathVariable UUID storyId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() ||
                authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(401).build();
        }

        String userIdStr = authentication.getName();
        UUID userId = UUID.fromString(userIdStr);

        StoryRating userRating = storyRatingService.getUserRating(userId, storyId);
        
        Map<String, Object> response = new HashMap<>();
        if (userRating != null) {
            response.put("hasRated", true);
            response.put("rating", userRating.getRating());
            response.put("createdAt", userRating.getCreatedAt());
            response.put("updatedAt", userRating.getUpdatedAt());
        } else {
            response.put("hasRated", false);
            response.put("rating", null);
        }
        
        response.put("canRate", storyRatingService.canUserRate(userId, storyId));
        
        return ResponseEntity.ok(response);
    }
}

@RestController
@RequestMapping("/api/users/{userId}/ratings")
@RequiredArgsConstructor
@Tag(name = "User Ratings", description = "User rating management operations")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000" })
class UserRatingController {

    private final StoryRatingService storyRatingService;

    @GetMapping
    @Operation(summary = "Get all ratings by a user")
    public ResponseEntity<List<StoryRatingResponse>> getUserRatings(@PathVariable UUID userId) {
        try {
            List<StoryRatingResponse> ratings = storyRatingService.getUserRatings(userId);
            return ResponseEntity.ok(ratings);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}