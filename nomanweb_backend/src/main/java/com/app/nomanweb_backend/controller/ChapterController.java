package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.chapter.*;
import com.app.nomanweb_backend.service.ChapterService;
import com.app.nomanweb_backend.service.ViewTrackingService;
import com.app.nomanweb_backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/chapters")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://127.0.0.1:3000" })
@Slf4j
public class ChapterController {

    private final ChapterService chapterService;
    private final JwtUtil jwtUtil;
    private final ViewTrackingService viewTrackingService;

    // Create a new chapter
    @PostMapping
    public ResponseEntity<ChapterResponse> createChapter(
            @Valid @RequestBody CreateChapterRequest request,
            HttpServletRequest httpRequest) {
        try {
            log.info(
                    "Creating chapter - Request: storyId={}, title={}, contentLength={}, chapterNumber={}, coinPrice={}, isFree={}, isDraft={}",
                    request.getStoryId(),
                    request.getTitle(),
                    request.getContent() != null ? request.getContent().length() : 0,
                    request.getChapterNumber(),
                    request.getCoinPrice(),
                    request.getIsFree(),
                    request.getIsDraft());

            UUID authorId = getCurrentUserId(httpRequest);
            log.info("Author ID: {}", authorId);

            ChapterResponse chapter = chapterService.createChapter(request, authorId);
            log.info("Chapter created successfully: {}", chapter.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(chapter);
        } catch (IllegalArgumentException e) {
            log.error("Error creating chapter: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error creating chapter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get chapter by ID
    @GetMapping("/{chapterId}")
    public ResponseEntity<ChapterResponse> getChapterById(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID currentUserId = getCurrentUserIdOptional(httpRequest);
            ChapterResponse chapter = chapterService.getChapterById(chapterId, currentUserId);

            // Track view using the new view tracking service
            viewTrackingService.trackChapterView(chapterId, currentUserId);

            return ResponseEntity.ok(chapter);
        } catch (IllegalArgumentException e) {
            log.error("Error getting chapter: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error getting chapter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get chapter by story ID and chapter number
    @GetMapping("/story/{storyId}/chapter/{chapterNumber}")
    public ResponseEntity<ChapterResponse> getChapterByStoryAndNumber(
            @PathVariable UUID storyId,
            @PathVariable Integer chapterNumber,
            HttpServletRequest httpRequest) {
        try {
            UUID currentUserId = getCurrentUserIdOptional(httpRequest);
            log.info("Request to get chapter - storyId: {}, chapterNumber: {}, userId: {}", storyId, chapterNumber,
                    currentUserId);

            ChapterResponse chapter = chapterService.getChapterByStoryAndNumber(storyId, chapterNumber, currentUserId);

            // Track view using the new view tracking service
            viewTrackingService.trackChapterView(chapter.getId(), currentUserId);

            log.info("Successfully returning chapter: {}", chapter.getId());
            return ResponseEntity.ok(chapter);
        } catch (IllegalArgumentException e) {
            log.error("Error getting chapter - storyId: {}, chapterNumber: {}, error: {}", storyId, chapterNumber,
                    e.getMessage());

            // Provide more specific error responses based on the error message
            if (e.getMessage().contains("Story not found")) {
                log.error("Story not found: {}", storyId);
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("Chapter not found")) {
                log.error("Chapter not found - storyId: {}, chapterNumber: {}", storyId, chapterNumber);
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("Access denied")) {
                log.error("Access denied to chapter - storyId: {}, chapterNumber: {}", storyId, chapterNumber);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            } else {
                log.error("Other error: {}", e.getMessage());
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Unexpected error getting chapter - storyId: {}, chapterNumber: {}", storyId, chapterNumber, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Update chapter
    @PutMapping("/{chapterId}")
    public ResponseEntity<ChapterResponse> updateChapter(
            @PathVariable UUID chapterId,
            @Valid @RequestBody UpdateChapterRequest request,
            HttpServletRequest httpRequest) {
        try {
            log.info("Received PUT request for chapter: {}", chapterId);
            log.info("Request data: title={}, content={}, coinPrice={}, isFree={}, shouldPublish={}",
                    request.getTitle(),
                    request.getContent() != null
                            ? request.getContent().substring(0, Math.min(100, request.getContent().length())) + "..."
                            : "null",
                    request.getCoinPrice(),
                    request.getIsFree(),
                    request.getShouldPublish());

            UUID authorId = getCurrentUserId(httpRequest);
            log.info("Author ID: {}", authorId);

            ChapterResponse chapter = chapterService.updateChapter(chapterId, request, authorId);
            log.info("Chapter update successful");
            return ResponseEntity.ok(chapter);
        } catch (IllegalArgumentException e) {
            log.error("Error updating chapter: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error updating chapter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Auto-save chapter (for rich text editor)
    @PutMapping("/{chapterId}/autosave")
    public ResponseEntity<ChapterResponse> autoSaveChapter(
            @PathVariable UUID chapterId,
            @Valid @RequestBody UpdateChapterRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            ChapterResponse chapter = chapterService.autoSaveChapter(chapterId, request, authorId);
            return ResponseEntity.ok(chapter);
        } catch (IllegalArgumentException e) {
            log.error("Error auto-saving chapter: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error auto-saving chapter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Delete chapter
    @DeleteMapping("/{chapterId}")
    public ResponseEntity<Void> deleteChapter(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            chapterService.deleteChapter(chapterId, authorId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.error("Error deleting chapter: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error deleting chapter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Bulk delete chapters
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDeleteChapters(
            @RequestBody List<UUID> chapterIds,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            chapterService.bulkDeleteChapters(chapterIds, authorId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.error("Error bulk deleting chapters: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error bulk deleting chapters", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get chapters by story
    @GetMapping("/story/{storyId}")
    public ResponseEntity<List<ChapterPreviewResponse>> getChaptersByStory(
            @PathVariable UUID storyId,
            HttpServletRequest httpRequest) {
        try {
            UUID currentUserId = getCurrentUserIdOptional(httpRequest);
            List<ChapterPreviewResponse> chapters = chapterService.getChaptersByStory(storyId, currentUserId);
            return ResponseEntity.ok(chapters);
        } catch (IllegalArgumentException e) {
            log.error("Error getting chapters: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error getting chapters", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get chapters by story with pagination
    @GetMapping("/story/{storyId}/paged")
    public ResponseEntity<Page<ChapterPreviewResponse>> getChaptersByStoryPaged(
            @PathVariable UUID storyId,
            @PageableDefault(size = 20) Pageable pageable,
            HttpServletRequest httpRequest) {
        try {
            UUID currentUserId = getCurrentUserIdOptional(httpRequest);
            Page<ChapterPreviewResponse> chapters = chapterService.getChaptersByStory(storyId, currentUserId, pageable);
            return ResponseEntity.ok(chapters);
        } catch (IllegalArgumentException e) {
            log.error("Error getting chapters: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error getting chapters", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Chapter navigation endpoints
    @GetMapping("/{chapterId}/next")
    public ResponseEntity<ChapterResponse> getNextChapter(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID currentUserId = getCurrentUserIdOptional(httpRequest);
            ChapterResponse chapter = chapterService.getNextChapter(chapterId, currentUserId);
            return ResponseEntity.ok(chapter);
        } catch (IllegalArgumentException e) {
            log.error("Error getting next chapter: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error getting next chapter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{chapterId}/previous")
    public ResponseEntity<ChapterResponse> getPreviousChapter(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID currentUserId = getCurrentUserIdOptional(httpRequest);
            ChapterResponse chapter = chapterService.getPreviousChapter(chapterId, currentUserId);
            return ResponseEntity.ok(chapter);
        } catch (IllegalArgumentException e) {
            log.error("Error getting previous chapter: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error getting previous chapter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/story/{storyId}/first")
    public ResponseEntity<ChapterResponse> getFirstChapter(
            @PathVariable UUID storyId,
            HttpServletRequest httpRequest) {
        try {
            UUID currentUserId = getCurrentUserIdOptional(httpRequest);
            ChapterResponse chapter = chapterService.getFirstChapter(storyId, currentUserId);
            return ResponseEntity.ok(chapter);
        } catch (IllegalArgumentException e) {
            log.error("Error getting first chapter: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error getting first chapter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/story/{storyId}/last")
    public ResponseEntity<ChapterResponse> getLastChapter(
            @PathVariable UUID storyId,
            HttpServletRequest httpRequest) {
        try {
            UUID currentUserId = getCurrentUserIdOptional(httpRequest);
            ChapterResponse chapter = chapterService.getLastChapter(storyId, currentUserId);
            return ResponseEntity.ok(chapter);
        } catch (IllegalArgumentException e) {
            log.error("Error getting last chapter: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error getting last chapter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Chapter management endpoints
    @PostMapping("/{chapterId}/publish")
    public ResponseEntity<ChapterResponse> publishChapter(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            ChapterResponse chapter = chapterService.publishChapter(chapterId, authorId);
            return ResponseEntity.ok(chapter);
        } catch (IllegalArgumentException e) {
            log.error("Error publishing chapter: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error publishing chapter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{chapterId}/unpublish")
    public ResponseEntity<?> unpublishChapter(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            ChapterResponse chapter = chapterService.unpublishChapter(chapterId, authorId);
            return ResponseEntity.ok(chapter);
        } catch (IllegalArgumentException e) {
            log.error("Error unpublishing chapter: {}", e.getMessage());

            // Return structured error response for purchase protection
            if (e.getMessage().contains("Cannot unpublish chapter with existing purchases")) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "PURCHASE_PROTECTION_VIOLATION");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("chapterId", chapterId.toString());
                errorResponse.put("requiresRefunds", true);

                return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
            }

            // Return generic error response
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "VALIDATION_ERROR");
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        } catch (RuntimeException e) {
            log.error("Error unpublishing chapter: {}", e.getMessage());

            // Check if it's an insufficient coins error
            if (e.getMessage().contains("Insufficient coins")) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "INSUFFICIENT_COINS");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("chapterId", chapterId.toString());
                errorResponse.put("requiresRefunds", true);
                errorResponse.put("insufficientCoins", true);

                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Return generic error response
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "UNPUBLISH_ERROR");
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Unexpected error unpublishing chapter", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "INTERNAL_SERVER_ERROR");
            errorResponse.put("message", "An unexpected error occurred");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Reorder chapters
    @PutMapping("/story/{storyId}/reorder")
    public ResponseEntity<Void> reorderChapters(
            @PathVariable UUID storyId,
            @RequestBody List<UUID> chapterIds,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            chapterService.reorderChapters(storyId, chapterIds, authorId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Error reordering chapters: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error reordering chapters", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Search chapters within story
    @GetMapping("/story/{storyId}/search")
    public ResponseEntity<List<ChapterPreviewResponse>> searchChaptersInStory(
            @PathVariable UUID storyId,
            @RequestParam String q,
            HttpServletRequest httpRequest) {
        try {
            UUID currentUserId = getCurrentUserIdOptional(httpRequest);
            List<ChapterPreviewResponse> chapters = chapterService.searchChaptersInStory(storyId, q, currentUserId);
            return ResponseEntity.ok(chapters);
        } catch (IllegalArgumentException e) {
            log.error("Error searching chapters: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error searching chapters", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Admin/Moderation endpoints
    @GetMapping("/moderation")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<ChapterResponse>> getChaptersForModeration(
            @PageableDefault(size = 20) Pageable pageable,
            HttpServletRequest httpRequest) {
        try {
            // Admin role check handled by @PreAuthorize annotation
            Page<ChapterResponse> chapters = chapterService.getChaptersForModeration(pageable);
            return ResponseEntity.ok(chapters);
        } catch (Exception e) {
            log.error("Unexpected error getting chapters for moderation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{chapterId}/moderate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ChapterResponse> moderateChapter(
            @PathVariable UUID chapterId,
            @RequestParam String notes,
            @RequestParam boolean approved,
            HttpServletRequest httpRequest) {
        try {
            UUID moderatorId = getCurrentUserId(httpRequest);
            // Admin role check handled by @PreAuthorize annotation
            ChapterResponse chapter = chapterService.moderateChapter(chapterId, notes, approved, moderatorId);
            return ResponseEntity.ok(chapter);
        } catch (IllegalArgumentException e) {
            log.error("Error moderating chapter: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error moderating chapter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Trash management endpoints

    // Move chapter to trash
    @PostMapping("/{chapterId}/trash")
    public ResponseEntity<?> moveChapterToTrash(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            chapterService.moveChapterToTrash(chapterId, authorId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Error moving chapter to trash: {}", e.getMessage());

            // Return structured error response for purchase protection
            if (e.getMessage().contains("Cannot move chapter to trash with existing purchases")) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "PURCHASE_PROTECTION_VIOLATION");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("chapterId", chapterId.toString());
                errorResponse.put("requiresRefunds", true);

                return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
            }

            // Return generic error response
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "VALIDATION_ERROR");
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Unexpected error moving chapter to trash", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "INTERNAL_SERVER_ERROR");
            errorResponse.put("message", "An unexpected error occurred");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Restore chapter from trash
    @PostMapping("/{chapterId}/restore")
    public ResponseEntity<Void> restoreChapterFromTrash(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            chapterService.restoreChapterFromTrash(chapterId, authorId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Error restoring chapter from trash: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error restoring chapter from trash", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Permanently delete chapter
    @DeleteMapping("/{chapterId}/permanent")
    public ResponseEntity<Void> permanentlyDeleteChapter(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            chapterService.permanentlyDeleteChapter(chapterId, authorId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.error("Error permanently deleting chapter: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error permanently deleting chapter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get chapters in trash by story
    @GetMapping("/story/{storyId}/trash")
    public ResponseEntity<List<ChapterPreviewResponse>> getTrashByStory(
            @PathVariable UUID storyId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            List<ChapterPreviewResponse> trashChapters = chapterService.getTrashByStory(storyId, authorId);
            return ResponseEntity.ok(trashChapters);
        } catch (IllegalArgumentException e) {
            log.error("Error getting trash chapters: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error getting trash chapters", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Bulk move to trash
    @PostMapping("/bulk/trash")
    public ResponseEntity<Void> bulkMoveToTrash(
            @RequestBody List<UUID> chapterIds,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            chapterService.bulkMoveToTrash(chapterIds, authorId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Error bulk moving chapters to trash: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error bulk moving chapters to trash", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Bulk restore from trash
    @PostMapping("/bulk/restore")
    public ResponseEntity<Void> bulkRestoreFromTrash(
            @RequestBody List<UUID> chapterIds,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            chapterService.bulkRestoreFromTrash(chapterIds, authorId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Error bulk publishing chapters: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error bulk publishing chapters", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Bulk publish chapters by story
    @PostMapping("/story/{storyId}/bulk/publish")
    public ResponseEntity<Void> bulkPublishChaptersByStory(
            @PathVariable UUID storyId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            chapterService.bulkPublishChaptersByStory(storyId, authorId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Error bulk publishing chapters: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error bulk publishing chapters", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Bulk unpublish chapters by story
    @PostMapping("/story/{storyId}/bulk/unpublish")
    public ResponseEntity<Void> bulkUnpublishChaptersByStory(
            @PathVariable UUID storyId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            chapterService.bulkUnpublishChaptersByStory(storyId, authorId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Error bulk unpublishing chapters: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error bulk unpublishing chapters", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Unpublish whole book with refunds
    @PostMapping("/story/{storyId}/unpublish-book")
    public ResponseEntity<?> unpublishWholeBook(
            @PathVariable UUID storyId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            chapterService.unpublishWholeBook(storyId, authorId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Error unpublishing whole book: {}", e.getMessage());

            // Return structured error response
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "VALIDATION_ERROR");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("storyId", storyId.toString());

            return ResponseEntity.badRequest().body(errorResponse);
        } catch (RuntimeException e) {
            log.error("Error unpublishing whole book: {}", e.getMessage());

            // Check if it's an insufficient coins error
            if (e.getMessage().contains("Insufficient coins")) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "INSUFFICIENT_COINS");
                errorResponse.put("message", e.getMessage());
                errorResponse.put("storyId", storyId.toString());
                errorResponse.put("requiresRefunds", true);
                errorResponse.put("insufficientCoins", true);

                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Return generic error response
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "UNPUBLISH_ERROR");
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Unexpected error unpublishing whole book", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "INTERNAL_SERVER_ERROR");
            errorResponse.put("message", "An unexpected error occurred");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Bulk permanently delete
    @DeleteMapping("/bulk/permanent")
    public ResponseEntity<Void> bulkPermanentlyDelete(
            @RequestBody List<UUID> chapterIds,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            chapterService.bulkPermanentlyDelete(chapterIds, authorId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.error("Error bulk permanently deleting chapters: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error bulk permanently deleting chapters", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Empty trash for story
    @DeleteMapping("/story/{storyId}/empty-trash")
    public ResponseEntity<Void> emptyTrash(
            @PathVariable UUID storyId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            chapterService.emptyTrash(storyId, authorId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.error("Error emptying trash: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error emptying trash", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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

    // Utility method to get current user ID (optional, returns null if not
    // authenticated)
    private UUID getCurrentUserIdOptional(HttpServletRequest request) {
        try {
            return getCurrentUserId(request);
        } catch (Exception e) {
            return null;
        }
    }
}