package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.chapter.*;
import com.app.nomanweb_backend.service.ChapterService;
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
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chapters")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://127.0.0.1:3000" })
@Slf4j
public class ChapterController {

    private final ChapterService chapterService;
    private final JwtUtil jwtUtil;

    // Create a new chapter
    @PostMapping
    public ResponseEntity<ChapterResponse> createChapter(
            @Valid @RequestBody CreateChapterRequest request,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            ChapterResponse chapter = chapterService.createChapter(request, authorId);
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

            // Increment view count (async in real implementation)
            if (currentUserId != null) {
                chapterService.incrementChapterViews(chapterId);
            }

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
            ChapterResponse chapter = chapterService.getChapterByStoryAndNumber(storyId, chapterNumber, currentUserId);

            // Increment view count (async in real implementation)
            if (currentUserId != null) {
                chapterService.incrementChapterViews(chapter.getId());
            }

            return ResponseEntity.ok(chapter);
        } catch (IllegalArgumentException e) {
            log.error("Error getting chapter: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error getting chapter", e);
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
    public ResponseEntity<ChapterResponse> unpublishChapter(
            @PathVariable UUID chapterId,
            HttpServletRequest httpRequest) {
        try {
            UUID authorId = getCurrentUserId(httpRequest);
            ChapterResponse chapter = chapterService.unpublishChapter(chapterId, authorId);
            return ResponseEntity.ok(chapter);
        } catch (IllegalArgumentException e) {
            log.error("Error unpublishing chapter: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error unpublishing chapter", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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
    public ResponseEntity<Page<ChapterResponse>> getChaptersForModeration(
            @PageableDefault(size = 20) Pageable pageable,
            HttpServletRequest httpRequest) {
        try {
            // TODO: Add admin role check
            Page<ChapterResponse> chapters = chapterService.getChaptersForModeration(pageable);
            return ResponseEntity.ok(chapters);
        } catch (Exception e) {
            log.error("Unexpected error getting chapters for moderation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{chapterId}/moderate")
    public ResponseEntity<ChapterResponse> moderateChapter(
            @PathVariable UUID chapterId,
            @RequestParam String notes,
            @RequestParam boolean approved,
            HttpServletRequest httpRequest) {
        try {
            UUID moderatorId = getCurrentUserId(httpRequest);
            // TODO: Add admin role check
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