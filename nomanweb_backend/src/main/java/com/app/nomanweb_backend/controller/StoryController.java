package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.story.CreateStoryRequest;
import com.app.nomanweb_backend.dto.story.UpdateStoryRequest;
import com.app.nomanweb_backend.dto.story.StoryResponse;
import com.app.nomanweb_backend.dto.story.StoryPreviewResponse;
import com.app.nomanweb_backend.service.StoryService;
import com.app.nomanweb_backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
@Slf4j
public class StoryController {

    private final StoryService storyService;
    private final JwtUtil jwtUtil;

    @PostMapping
    public ResponseEntity<StoryResponse> createStory(
            @Valid @RequestBody CreateStoryRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            StoryResponse response = storyService.createStory(request, authorId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            log.error("Error creating story: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<StoryResponse> getStory(@PathVariable UUID id) {
        try {
            StoryResponse story = storyService.getStoryById(id);
            // Increment view count
            storyService.incrementViews(id);
            return ResponseEntity.ok(story);
        } catch (RuntimeException e) {
            log.error("Error getting story {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<StoryResponse> updateStory(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStoryRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            StoryResponse response = storyService.updateStory(id, request, authorId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error updating story {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStory(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            storyService.deleteStory(id, authorId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting story {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<Page<StoryPreviewResponse>> getStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String contentType,
            @RequestParam(required = false) UUID authorId) {
        try {
            Page<StoryPreviewResponse> stories;

            // If filters are provided, use filtered search
            if (status != null || categoryId != null || contentType != null || authorId != null) {
                stories = storyService.getStoriesWithFilters(
                        status, categoryId, contentType, authorId, sortBy, page, size);
            } else {
                stories = storyService.getPublishedStories(page, size, sortBy);
            }

            return ResponseEntity.ok(stories);
        } catch (RuntimeException e) {
            log.error("Error getting stories: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/my-stories")
    public ResponseEntity<Page<StoryPreviewResponse>> getMyStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            Page<StoryPreviewResponse> stories = storyService.getMyStories(authorId, page, size);
            return ResponseEntity.ok(stories);
        } catch (RuntimeException e) {
            log.error("Error getting user stories: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/author/{authorId}")
    public ResponseEntity<Page<StoryPreviewResponse>> getStoriesByAuthor(
            @PathVariable UUID authorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<StoryPreviewResponse> stories = storyService.getStoriesByAuthor(authorId, page, size);
            return ResponseEntity.ok(stories);
        } catch (RuntimeException e) {
            log.error("Error getting stories by author {}: {}", authorId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Page<StoryPreviewResponse>> getStoriesByCategory(
            @PathVariable UUID categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<StoryPreviewResponse> stories = storyService.getStoriesByCategory(categoryId, page, size);
            return ResponseEntity.ok(stories);
        } catch (RuntimeException e) {
            log.error("Error getting stories by category {}: {}", categoryId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<Page<StoryPreviewResponse>> searchStories(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<StoryPreviewResponse> stories = storyService.searchStories(query, page, size);
            return ResponseEntity.ok(stories);
        } catch (RuntimeException e) {
            log.error("Error searching stories with query '{}': {}", query, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/trending")
    public ResponseEntity<Page<StoryPreviewResponse>> getTrendingStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<StoryPreviewResponse> stories = storyService.getTrendingStories(page, size);
            return ResponseEntity.ok(stories);
        } catch (RuntimeException e) {
            log.error("Error getting trending stories: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/featured")
    public ResponseEntity<Page<StoryPreviewResponse>> getFeaturedStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<StoryPreviewResponse> stories = storyService.getFeaturedStories(page, size);
            return ResponseEntity.ok(stories);
        } catch (RuntimeException e) {
            log.error("Error getting featured stories: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<StoryResponse> publishStory(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            StoryResponse response = storyService.publishStory(id, authorId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error publishing story {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/unpublish")
    public ResponseEntity<StoryResponse> unpublishStory(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            StoryResponse response = storyService.unpublishStory(id, authorId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error unpublishing story {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/can-access")
    public ResponseEntity<Boolean> canUserAccessStory(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getUserIdFromRequest(httpRequest);
            boolean canAccess = storyService.canUserAccessStory(id, userId);
            return ResponseEntity.ok(canAccess);
        } catch (RuntimeException e) {
            // If no valid token, check if story is public
            try {
                StoryResponse story = storyService.getStoryById(id);
                boolean isPublic = "PUBLISHED".equals(story.getStatus().toString());
                return ResponseEntity.ok(isPublic);
            } catch (RuntimeException ex) {
                return ResponseEntity.notFound().build();
            }
        }
    }

    private UUID getUserIdFromRequest(HttpServletRequest request) {
        // Get the authenticated user from SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getPrincipal().equals("anonymousUser")) {
            return UUID.fromString(authentication.getName());
        }
        throw new RuntimeException("No valid authentication found");
    }
}