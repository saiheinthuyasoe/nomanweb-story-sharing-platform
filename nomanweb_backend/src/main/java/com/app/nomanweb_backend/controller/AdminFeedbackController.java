package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.service.ChapterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/chapters")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
public class AdminFeedbackController {

    @Autowired
    private ChapterService chapterService;

    /**
     * Get all chapters with writer feedback
     */
    @GetMapping("/feedback")
    public ResponseEntity<Page<Chapter>> getChaptersWithFeedback(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        
        Pageable pageable = PageRequest.of(page, size, 
            Sort.by(Sort.Direction.DESC, "feedbackSubmittedAt"));
        
        Page<Chapter> chapters;
        
        if (status != null && !status.equals("all")) {
            if (status.equals("pending")) {
                // Chapters with feedback but no moderation response yet
                chapters = chapterService.getChaptersWithFeedbackByStatus(
                    List.of(Chapter.ModerationStatus.PENDING), pageable);
            } else if (status.equals("reviewed")) {
                // Chapters with feedback that have been reviewed (approved/rejected)
                chapters = chapterService.getChaptersWithFeedbackByStatus(
                    List.of(Chapter.ModerationStatus.APPROVED, Chapter.ModerationStatus.REJECTED), pageable);
            } else {
                // All chapters with feedback
                chapters = chapterService.getChaptersWithFeedback(pageable);
            }
        } else {
            // All chapters with feedback
            chapters = chapterService.getChaptersWithFeedback(pageable);
        }
        
        return ResponseEntity.ok(chapters);
    }

    /**
     * Mark feedback as reviewed
     */
    @PostMapping("/{chapterId}/feedback/mark-reviewed")
    public ResponseEntity<String> markFeedbackAsReviewed(@PathVariable String chapterId) {
        try {
            chapterService.markFeedbackAsReviewed(java.util.UUID.fromString(chapterId));
            return ResponseEntity.ok("Feedback marked as reviewed");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error marking feedback as reviewed: " + e.getMessage());
        }
    }

    /**
     * Respond to feedback
     */
    @PostMapping("/{chapterId}/feedback/respond")
    public ResponseEntity<String> respondToFeedback(
            @PathVariable String chapterId,
            @RequestBody java.util.Map<String, String> request) {
        try {
            String response = request.get("response");
            if (response == null || response.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Response text is required");
            }
            
            chapterService.respondToFeedback(java.util.UUID.fromString(chapterId), response.trim());
            return ResponseEntity.ok("Response sent successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error responding to feedback: " + e.getMessage());
        }
    }
}