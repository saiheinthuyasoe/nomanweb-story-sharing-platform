package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.chapter.*;
import com.app.nomanweb_backend.dto.moderation.ContentModerationResult;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.repository.ChapterRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.service.ChapterService;
import com.app.nomanweb_backend.service.ViewTrackingService;
import com.app.nomanweb_backend.service.ContentModerationService;
import com.app.nomanweb_backend.service.ChapterModerationQueueService;
import com.app.nomanweb_backend.util.JwtUtil;
import com.app.nomanweb_backend.controller.UserController;
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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.io.IOException;
import java.io.InputStream;

// Document parsing imports
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

@RestController
@RequestMapping("/api/chapters")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
@Slf4j
public class ChapterController {

    private final ChapterService chapterService;
    private final JwtUtil jwtUtil;
    private final ViewTrackingService viewTrackingService;
    private final ContentModerationService contentModerationService;
    private final ChapterModerationQueueService chapterModerationQueueService;
    private final ChapterRepository chapterRepository;
    private final StoryRepository storyRepository;

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

            // Broadcast real-time update for new chapter creation
            Map<String, Object> chapterData = new HashMap<>();
            chapterData.put("chapterId", chapter.getId().toString());
            chapterData.put("storyId", request.getStoryId().toString());
            chapterData.put("authorId", authorId.toString());
            chapterData.put("title", chapter.getTitle());
            chapterData.put("chapterNumber", chapter.getChapterNumber());
            chapterData.put("isDraft", chapter.getStatus() == Chapter.Status.DRAFT);
            UserController.broadcastSocialUpdate(authorId, "chapter_created", chapterData);

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
            @RequestParam(defaultValue = "false") boolean confirmRefund,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            ChapterResponse chapter = chapterService.unpublishChapter(chapterId, authorId, confirmRefund);
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

    @PostMapping("/{chapterId}/analyze-content")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContentModerationResult> analyzeChapterContent(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            // Get chapter content using admin access (bypasses ownership checks)
            ChapterResponse chapter = chapterService.getChapterByIdForAdmin(chapterId);

            // Analyze content using AI
            ContentModerationResult result = contentModerationService.analyzeContent(chapter.getContent());

            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            log.error("Error analyzing chapter content: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error analyzing chapter content", e);
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
            @RequestParam(defaultValue = "false") boolean confirmRefund,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            chapterService.unpublishWholeBook(storyId, authorId, confirmRefund);
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

    // Bulk upload endpoint
    @PostMapping("/story/{storyId}/bulk-upload")
    public ResponseEntity<?> bulkUploadChapter(
            @PathVariable UUID storyId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "chapterNumber", required = false) Integer chapterNumber,
            @RequestParam(value = "isDraft", defaultValue = "false") boolean isDraft,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            log.info("Bulk upload request for story: {} by author: {}", storyId, authorId);

            // Verify story exists and user is the author
            Story story = storyRepository.findById(storyId)
                    .orElseThrow(() -> new IllegalArgumentException("Story not found"));

            if (!story.getAuthor().getId().equals(authorId)) {
                throw new IllegalArgumentException("You can only upload chapters to your own stories");
            }

            // Validate file type
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.trim().isEmpty()) {
                throw new IllegalArgumentException("Invalid file name");
            }

            String fileExtension = "";
            int lastDotIndex = originalFilename.lastIndexOf(".");
            if (lastDotIndex > 0) {
                fileExtension = originalFilename.substring(lastDotIndex).toLowerCase();
            }

            // Allow txt, html, htm, md, markdown, pdf, doc, docx files
            if (!fileExtension.equals(".txt") && !fileExtension.equals(".html") &&
                    !fileExtension.equals(".htm") && !fileExtension.equals(".md") &&
                    !fileExtension.equals(".markdown") && !fileExtension.equals(".pdf") &&
                    !fileExtension.equals(".doc") && !fileExtension.equals(".docx")) {
                throw new IllegalArgumentException(
                        "Invalid file type. Only TXT, HTML, MD, PDF, DOC, and DOCX files are supported.");
            }

            // Process the uploaded file content based on file type
            String content;
            try {
                content = extractContentFromFile(file, fileExtension);
            } catch (Exception e) {
                throw new IllegalArgumentException("Failed to read file content: " + e.getMessage());
            }

            if (content.trim().isEmpty()) {
                throw new IllegalArgumentException("File content cannot be empty");
            }

            // Use filename as title if not provided
            String chapterTitle = title;
            if (chapterTitle == null || chapterTitle.trim().isEmpty()) {
                chapterTitle = file.getOriginalFilename();
                if (chapterTitle != null && chapterTitle.contains(".")) {
                    chapterTitle = chapterTitle.substring(0, chapterTitle.lastIndexOf("."));
                }
                if (chapterTitle == null || chapterTitle.trim().isEmpty()) {
                    chapterTitle = "Uploaded Chapter";
                }
            }

            // Determine chapter number if not provided
            Integer finalChapterNumber = chapterNumber;
            if (finalChapterNumber == null) {
                finalChapterNumber = chapterRepository.findMaxChapterNumberByStory(story)
                        .map(max -> max + 1)
                        .orElse(1);
            }

            // Check if chapter number already exists
            if (chapterRepository.existsByStoryAndChapterNumber(story, finalChapterNumber)) {
                throw new IllegalArgumentException(
                        "Chapter number " + finalChapterNumber + " already exists in this story");
            }

            // Create the chapter with appropriate status based on draft flag
            Chapter.Status initialStatus = isDraft ? Chapter.Status.DRAFT : Chapter.Status.PENDING;
            Chapter.ModerationStatus initialModerationStatus = isDraft ? null : Chapter.ModerationStatus.PENDING;

            Chapter chapter = Chapter.builder()
                    .story(story)
                    .title(chapterTitle.trim())
                    .content(content)
                    .chapterNumber(finalChapterNumber)
                    .coinPrice(BigDecimal.ZERO)
                    .isFree(true)
                    .status(initialStatus)
                    .moderationStatus(initialModerationStatus)
                    .build();

            // Calculate word count
            chapter.updateWordCount();

            // Save chapter first
            chapter = chapterRepository.save(chapter);

            // Only queue for AI moderation if not a draft
            if (!isDraft) {
                chapterModerationQueueService.queueChapterForModeration(chapter, "BULK_UPLOAD");
                log.info("Chapter queued for AI moderation: {} (operation: BULK_UPLOAD)", chapter.getId());
            } else {
                log.info("Chapter saved as draft, skipping moderation: {}", chapter.getId());
            }

            // Update story chapter count
            story.setTotalChapters(story.getTotalChapters() + 1);
            storyRepository.save(story);

            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            String message = isDraft ? "Chapter uploaded successfully as draft"
                    : "Chapter uploaded successfully and queued for moderation";
            response.put("message", message);
            response.put("chapterId", chapter.getId().toString());
            response.put("title", chapter.getTitle());
            response.put("chapterNumber", chapter.getChapterNumber());
            response.put("status", chapter.getStatus().toString());
            response.put("moderationStatus",
                    chapter.getModerationStatus() != null ? chapter.getModerationStatus().toString() : null);
            response.put("wordCount", chapter.getWordCount());
            response.put("isDraft", isDraft);

            log.info("Chapter created successfully via bulk upload: {}", chapter.getId());
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Error in bulk upload: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Unexpected error in bulk upload", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Internal server error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
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

    /**
     * Extract text content from different file types
     */
    private String extractContentFromFile(MultipartFile file, String fileExtension) throws IOException {
        try (InputStream inputStream = file.getInputStream()) {
            switch (fileExtension.toLowerCase()) {
                case ".txt":
                case ".html":
                case ".htm":
                case ".md":
                case ".markdown":
                    // For text-based files, read as UTF-8
                    return new String(file.getBytes(), "UTF-8");

                case ".pdf":
                    // Extract text from PDF using PDFBox
                    try (PDDocument document = PDDocument.load(inputStream)) {
                        PDFTextStripper stripper = new PDFTextStripper();
                        return stripper.getText(document);
                    }

                case ".docx":
                    // Extract text from DOCX using Apache POI
                    try (XWPFDocument document = new XWPFDocument(inputStream);
                            XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
                        return extractor.getText();
                    }

                case ".doc":
                    // Extract text from DOC using Apache POI
                    try (HWPFDocument document = new HWPFDocument(inputStream);
                            WordExtractor extractor = new WordExtractor(document)) {
                        return extractor.getText();
                    }

                default:
                    throw new IllegalArgumentException("Unsupported file type: " + fileExtension);
            }
        } catch (IOException e) {
            log.error("Error extracting content from file: {}", e.getMessage());
            throw new IOException("Failed to extract content from file: " + e.getMessage(), e);
        }
    }
}