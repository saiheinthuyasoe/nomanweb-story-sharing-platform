package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.story.CreateStoryRequest;
import com.app.nomanweb_backend.dto.story.UpdateStoryRequest;
import com.app.nomanweb_backend.dto.story.StoryResponse;
import com.app.nomanweb_backend.dto.story.StoryPreviewResponse;
import com.app.nomanweb_backend.service.StoryService;
import com.app.nomanweb_backend.service.ViewTrackingService;
import com.app.nomanweb_backend.service.PurchaseProtectionService;
import com.app.nomanweb_backend.service.PurchaseProtectionException;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
@Slf4j
public class StoryController {

    private final StoryService storyService;
    private final JwtUtil jwtUtil;
    private final ViewTrackingService viewTrackingService;
    private final PurchaseProtectionService purchaseProtectionService;

    // Simple test endpoint to verify routing is working
    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "StoryController is working!");
        response.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

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
    public ResponseEntity<StoryResponse> getStory(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "false") boolean incrementView,
            HttpServletRequest httpRequest) {
        try {
            StoryResponse story = storyService.getStoryById(id);

            // Track view if explicitly requested and user is not the author
            if (incrementView) {
                UUID currentUserId = getCurrentUserIdOptional(httpRequest);
                if (currentUserId == null || !story.getAuthor().getId().equals(currentUserId)) {
                    viewTrackingService.trackStoryView(id, currentUserId);
                }
            }

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

    // Trash management endpoints

    // Move story to trash
    @PostMapping("/{id}/trash")
    public ResponseEntity<?> moveStoryToTrash(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            log.info("🔄 Received request to move story to trash: {}", id);
            UUID authorId = getUserIdFromRequest(httpRequest);
            log.info("🔄 Moving story {} to trash by author: {}", id, authorId);

            storyService.moveStoryToTrash(id, authorId);

            log.info("✅ Successfully moved story {} to trash", id);
            return ResponseEntity.ok().build();
        } catch (PurchaseProtectionException e) {
            log.error("🚨 Purchase protection violation for story {}: {}", id, e.getMessage());

            // Return structured error response for purchase protection
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "PURCHASE_PROTECTION_VIOLATION");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("storyId", e.getStoryId());
            errorResponse.put("storyTitle", e.getStoryTitle());
            errorResponse.put("totalPurchases", e.getTotalPurchases());
            errorResponse.put("refundAmount", e.getRefundAmount());
            errorResponse.put("requiresRefunds", e.requiresRefunds());

            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
        } catch (RuntimeException e) {
            log.error("❌ Error moving story to trash {}: {}", id, e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "GENERAL_ERROR");
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Restore story from trash
    @PostMapping("/{id}/restore")
    public ResponseEntity<Void> restoreStoryFromTrash(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            storyService.restoreStoryFromTrash(id, authorId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Error restoring story from trash {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Permanently delete story
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> permanentlyDeleteStory(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            storyService.permanentlyDeleteStory(id, authorId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error permanently deleting story {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Get stories in trash by author
    @GetMapping("/author/{authorId}/trash")
    public ResponseEntity<List<StoryPreviewResponse>> getTrashByAuthor(
            @PathVariable UUID authorId,
            HttpServletRequest httpRequest) {
        try {
            UUID currentUserId = getUserIdFromRequest(httpRequest);
            if (!currentUserId.equals(authorId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            List<StoryPreviewResponse> trashStories = storyService.getTrashByAuthor(authorId);
            return ResponseEntity.ok(trashStories);
        } catch (RuntimeException e) {
            log.error("Error getting trash stories: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Bulk move to trash
    @PostMapping("/bulk/trash")
    public ResponseEntity<Void> bulkMoveToTrash(
            @RequestBody List<UUID> storyIds,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            storyService.bulkMoveToTrash(storyIds, authorId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Error bulk moving stories to trash: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Bulk restore from trash
    @PostMapping("/bulk/restore")
    public ResponseEntity<Void> bulkRestoreFromTrash(
            @RequestBody List<UUID> storyIds,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            storyService.bulkRestoreFromTrash(storyIds, authorId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Error bulk restoring stories from trash: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Bulk permanently delete
    @DeleteMapping("/bulk/permanent")
    public ResponseEntity<Void> bulkPermanentlyDelete(
            @RequestBody List<UUID> storyIds,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            storyService.bulkPermanentlyDelete(storyIds, authorId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error bulk permanently deleting stories: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Empty trash for author
    @DeleteMapping("/author/{authorId}/trash")
    public ResponseEntity<Void> emptyTrash(
            @PathVariable UUID authorId,
            HttpServletRequest httpRequest) {
        try {
            UUID currentUserId = getUserIdFromRequest(httpRequest);
            if (!currentUserId.equals(authorId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            storyService.emptyTrash(authorId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error emptying trash: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<Page<StoryPreviewResponse>> getStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String publishStatus,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String pricingType,
            @RequestParam(required = false) String bookStatus,
            @RequestParam(required = false) UUID authorId) {
        try {
            Page<StoryPreviewResponse> stories;

            // If filters are provided, use filtered search
            if (publishStatus != null || categoryId != null || pricingType != null || bookStatus != null
                    || authorId != null) {
                stories = storyService.getStoriesWithFilters(
                        publishStatus, categoryId, pricingType, bookStatus, authorId, sortBy, page, size);
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

    @GetMapping("/my-stories/all")
    public ResponseEntity<Page<StoryPreviewResponse>> getMyStoriesIncludingDeleted(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            log.info("📚 Fetching all stories including deleted for author: {}", authorId);

            Page<StoryPreviewResponse> stories = storyService.getMyStoriesIncludingDeleted(authorId, page, size);

            log.info("📚 Returned {} stories for author {} (including deleted)",
                    stories.getTotalElements(), authorId);

            return ResponseEntity.ok(stories);
        } catch (RuntimeException e) {
            log.error("❌ Error getting my stories including deleted: {}", e.getMessage());
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
            @RequestParam(defaultValue = "true") boolean autoPublishChapters,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            StoryResponse response = storyService.publishStory(id, authorId, autoPublishChapters);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error publishing story {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/unpublish")
    public ResponseEntity<?> unpublishStory(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            StoryResponse response = storyService.unpublishStory(id, authorId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error unpublishing story {}: {}", id, e.getMessage());

            // Return structured error response
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "UNPUBLISH_ERROR");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("storyId", id.toString());

            // Check if refunds are required
            if (e.getMessage().contains("Refunds required first")) {
                errorResponse.put("requiresRefunds", true);
                errorResponse.put("refundCheckRequired", true);
            }

            return ResponseEntity.badRequest().body(errorResponse);
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
                boolean isPublic = "PUBLISHED".equals(story.getPublishStatus().toString());
                return ResponseEntity.ok(isPublic);
            } catch (RuntimeException ex) {
                return ResponseEntity.notFound().build();
            }
        }
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<Void> incrementStoryView(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            UUID currentUserId = getCurrentUserIdOptional(httpRequest);
            StoryResponse story = storyService.getStoryById(id);

            // Only track view if user is not the author
            if (currentUserId == null || !story.getAuthor().getId().equals(currentUserId)) {
                viewTrackingService.trackStoryView(id, currentUserId);
            }

            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Error tracking story view {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Check if story has purchases (for refund functionality)
    @GetMapping("/{id}/has-purchases")
    public ResponseEntity<?> checkStoryHasPurchases(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            log.info("🔍 Checking purchases for story: {} by author: {}", id, authorId);

            boolean hasPurchases = purchaseProtectionService.storyHasPurchases(id);

            Map<String, Object> response = new HashMap<>();
            response.put("hasPurchases", hasPurchases);
            response.put("storyId", id.toString());

            log.info("✅ Story {} has purchases: {}", id, hasPurchases);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("❌ Error checking story purchases for {}: {}", id, e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "CHECK_PURCHASES_ERROR");
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // Calculate refund for unpublishing a story
    @PostMapping("/{id}/calculate-refund")
    public ResponseEntity<?> calculateStoryRefund(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            log.info("🧮 Calculating refund for story: {} by author: {}", id, authorId);

            PurchaseProtectionService.RefundCalculationResult result = purchaseProtectionService
                    .calculateStoryRefund(id);

            Map<String, Object> response = new HashMap<>();
            response.put("hasPurchases", result.isHasPurchases());
            response.put("totalRefundAmount", result.getTotalRefundAmount());
            response.put("affectedPurchasers", result.getAffectedPurchasers());
            response.put("requiresRefunds", result.isRequiresRefunds());
            response.put("pricingType", result.getPricingType());
            response.put("storyId", id.toString());

            log.info("✅ Refund calculation complete for story {}: {} refund, {} purchasers",
                    id, result.getTotalRefundAmount(), result.getAffectedPurchasers());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("❌ Error calculating story refund for {}: {}", id, e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "CALCULATE_REFUND_ERROR");
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/{id}/recalculate-earnings")
    public ResponseEntity<?> recalculateStoryEarnings(
            @PathVariable UUID id,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getUserIdFromRequest(httpRequest);
            Map<String, Object> result = storyService.recalculateStoryEarnings(id, authorId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            log.error("Error recalculating earnings for story {}: {}", id, e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
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

    private UUID getCurrentUserIdOptional(HttpServletRequest request) {
        try {
            return getUserIdFromRequest(request);
        } catch (Exception e) {
            return null;
        }
    }
}