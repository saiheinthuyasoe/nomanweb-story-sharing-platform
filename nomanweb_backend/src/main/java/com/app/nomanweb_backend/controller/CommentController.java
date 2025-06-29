package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.Comment;
import com.app.nomanweb_backend.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Comment management operations")
@CrossOrigin(origins = { "http://localhost:3000", "http://127.0.0.1:3000" })
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    @Operation(summary = "Create a new comment")
    public ResponseEntity<Comment> createComment(
            @RequestBody CreateCommentRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() ||
                authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(401).build();
        }

        String userIdStr = authentication.getName();
        UUID userId = UUID.fromString(userIdStr);

        Comment comment = commentService.createComment(
                userId,
                request.getStoryId(),
                request.getChapterId(),
                request.getContent());

        return ResponseEntity.ok(comment);
    }

    @PostMapping("/{commentId}/reply")
    @Operation(summary = "Reply to a comment")
    public ResponseEntity<Comment> replyToComment(
            @PathVariable UUID commentId,
            @RequestBody CreateReplyRequest request,
            @AuthenticationPrincipal Principal principal) {

        String userIdStr = principal.getName();
        UUID userId = UUID.fromString(userIdStr);

        Comment reply = commentService.createReply(userId, commentId, request.getContent());
        return ResponseEntity.ok(reply);
    }

    @GetMapping("/story/{storyId}")
    @Operation(summary = "Get comments for a story")
    public ResponseEntity<Page<Comment>> getStoryComments(
            @PathVariable UUID storyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Comment> comments = commentService.getStoryComments(storyId, pageable);

        return ResponseEntity.ok(comments);
    }

    @GetMapping("/chapter/{chapterId}")
    @Operation(summary = "Get comments for a chapter")
    public ResponseEntity<Page<Comment>> getChapterComments(
            @PathVariable UUID chapterId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Comment> comments = commentService.getChapterComments(chapterId, pageable);

        return ResponseEntity.ok(comments);
    }

    @GetMapping("/{commentId}/replies")
    @Operation(summary = "Get replies to a comment")
    public ResponseEntity<List<Comment>> getCommentReplies(@PathVariable UUID commentId) {
        List<Comment> replies = commentService.getCommentReplies(commentId);
        return ResponseEntity.ok(replies);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get comments by user")
    public ResponseEntity<Page<Comment>> getUserComments(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Comment> comments = commentService.getUserComments(userId, pageable);

        return ResponseEntity.ok(comments);
    }

    @PostMapping("/{commentId}/like")
    @Operation(summary = "Toggle like on a comment")
    public ResponseEntity<Map<String, Object>> toggleCommentLike(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal Principal principal) {

        String userIdStr = principal.getName();
        UUID userId = UUID.fromString(userIdStr);

        boolean alreadyLiked = commentService.hasUserLikedComment(commentId, userId);

        if (alreadyLiked) {
            commentService.unlikeComment(commentId, userId);
        } else {
            commentService.likeComment(commentId, userId);
        }

        boolean liked = !alreadyLiked;

        return ResponseEntity.ok(Map.of(
                "liked", liked,
                "message", liked ? "Comment liked" : "Comment unliked"));
    }

    @PutMapping("/{commentId}")
    @Operation(summary = "Update a comment")
    public ResponseEntity<Comment> updateComment(
            @PathVariable UUID commentId,
            @RequestBody UpdateCommentRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() ||
                authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(401).build();
        }

        String userIdStr = authentication.getName();
        UUID userId = UUID.fromString(userIdStr);

        Comment comment = commentService.updateComment(commentId, request.getContent(), userId);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/{commentId}")
    @Operation(summary = "Delete a comment")
    public ResponseEntity<Void> deleteComment(@PathVariable UUID commentId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() ||
                authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(401).build();
        }

        String userIdStr = authentication.getName();
        UUID userId = UUID.fromString(userIdStr);

        commentService.deleteComment(commentId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{commentId}/pin")
    @Operation(summary = "Pin a comment")
    public ResponseEntity<Comment> pinComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal Principal principal) {

        String userIdStr = principal.getName();
        UUID userId = UUID.fromString(userIdStr);

        Comment comment = commentService.pinComment(userId, commentId);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/{commentId}/pin")
    @Operation(summary = "Unpin a comment")
    public ResponseEntity<Comment> unpinComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal Principal principal) {

        String userIdStr = principal.getName();
        UUID userId = UUID.fromString(userIdStr);

        Comment comment = commentService.unpinComment(userId, commentId);
        return ResponseEntity.ok(comment);
    }

    @PostMapping("/{commentId}/flag")
    @Operation(summary = "Flag a comment")
    public ResponseEntity<Comment> flagComment(
            @PathVariable UUID commentId,
            @RequestBody FlagCommentRequest request,
            @AuthenticationPrincipal Principal principal) {

        String userIdStr = principal.getName();
        UUID userId = UUID.fromString(userIdStr);

        Comment comment = commentService.flagComment(userId, commentId, request.getReason());
        return ResponseEntity.ok(comment);
    }

    @GetMapping("/pinned")
    @Operation(summary = "Get pinned comments")
    public ResponseEntity<List<Comment>> getPinnedComments(
            @RequestParam(required = false) UUID storyId,
            @RequestParam(required = false) UUID chapterId) {

        List<Comment> comments = commentService.getPinnedComments(storyId, chapterId);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/latest")
    @Operation(summary = "Get latest comments")
    public ResponseEntity<Page<Comment>> getLatestComments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Comment> comments = commentService.getLatestComments(pageable);

        return ResponseEntity.ok(comments);
    }

    @GetMapping("/stats")
    @Operation(summary = "Get comment statistics")
    public ResponseEntity<Map<String, Object>> getCommentStats(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) UUID storyId,
            @RequestParam(required = false) UUID chapterId) {

        Map<String, Object> stats;

        if (userId != null) {
            stats = commentService.getCommentStats(userId);
        } else {
            stats = commentService.getContentCommentStats(storyId, chapterId);
        }

        return ResponseEntity.ok(stats);
    }

    // Admin endpoints
    @GetMapping("/pending")
    @Operation(summary = "Get pending comments (Admin only)")
    public ResponseEntity<Page<Comment>> getPendingComments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Comment> comments = commentService.getPendingComments(pageable);

        return ResponseEntity.ok(comments);
    }

    @PostMapping("/{commentId}/approve")
    @Operation(summary = "Approve a comment (Admin only)")
    public ResponseEntity<Comment> approveComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal Principal principal) {

        String userIdStr = principal.getName();
        UUID moderatorId = UUID.fromString(userIdStr);

        Comment comment = commentService.approveComment(commentId, moderatorId);
        return ResponseEntity.ok(comment);
    }

    @PostMapping("/{commentId}/reject")
    @Operation(summary = "Reject a comment (Admin only)")
    public ResponseEntity<Comment> rejectComment(
            @PathVariable UUID commentId,
            @RequestBody RejectCommentRequest request,
            @AuthenticationPrincipal Principal principal) {

        String userIdStr = principal.getName();
        UUID moderatorId = UUID.fromString(userIdStr);

        Comment comment = commentService.rejectComment(commentId, moderatorId, request.getReason());
        return ResponseEntity.ok(comment);
    }

    // DTOs
    public static class CreateCommentRequest {
        private String content;
        private UUID storyId;
        private UUID chapterId;

        // Getters and setters
        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public UUID getStoryId() {
            return storyId;
        }

        public void setStoryId(UUID storyId) {
            this.storyId = storyId;
        }

        public UUID getChapterId() {
            return chapterId;
        }

        public void setChapterId(UUID chapterId) {
            this.chapterId = chapterId;
        }
    }

    public static class CreateReplyRequest {
        private String content;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }

    public static class UpdateCommentRequest {
        private String content;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }

    public static class FlagCommentRequest {
        private String reason;

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }

    public static class RejectCommentRequest {
        private String reason;

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}