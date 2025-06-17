package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.upload.FileUploadResponse;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.dto.story.StoryResponse;
import com.app.nomanweb_backend.dto.story.UpdateStoryRequest;
import com.app.nomanweb_backend.service.FileUploadService;
import com.app.nomanweb_backend.service.AuthService;
import com.app.nomanweb_backend.service.StoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class FileUploadController {

    private final FileUploadService fileUploadService;
    private final AuthService authService;
    private final StoryService storyService;

    @PostMapping("/profile-image")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<FileUploadResponse> uploadProfileImage(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest httpRequest) {

        try {
            log.info("Uploading profile image for user");

            // Get current user
            UUID userId = getCurrentUserId(httpRequest);
            User user = authService.getCurrentUser(userId);

            // Delete old profile image if exists
            if (user.getProfileImageUrl() != null) {
                try {
                    fileUploadService.deleteImage(user.getProfileImageUrl());
                } catch (Exception e) {
                    log.warn("Failed to delete old profile image: {}", user.getProfileImageUrl(), e);
                }
            }

            // Upload new image
            String imageUrl = fileUploadService.uploadImage(file, "profile_images");

            // Update user profile image
            User updatedUser = User.builder()
                    .profileImageUrl(imageUrl)
                    .build();
            authService.updateProfile(userId, updatedUser);

            log.info("Profile image uploaded successfully for user: {}", userId);

            return ResponseEntity.ok(FileUploadResponse.success(
                    imageUrl,
                    fileUploadService.extractPublicIdFromUrl(imageUrl),
                    file.getSize(),
                    file.getOriginalFilename(),
                    "profile_images"));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid file upload request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(FileUploadResponse.error("Invalid file: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to upload profile image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(FileUploadResponse.error("Failed to upload image: " + e.getMessage()));
        }
    }

    @PostMapping("/story-cover")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<FileUploadResponse> uploadStoryCover(
            @RequestParam("file") MultipartFile file,
            @RequestParam("storyId") String storyId,
            HttpServletRequest httpRequest) {

        try {
            log.info("Uploading cover image for story: {}", storyId);

            // Get current user
            UUID userId = getCurrentUserId(httpRequest);

            // Get story and verify ownership
            StoryResponse story = storyService.getStoryById(UUID.fromString(storyId));

            // Check if user is the story owner
            if (!storyService.isStoryOwner(UUID.fromString(storyId), userId)) {
                log.warn("User {} attempted to upload cover for story {} they don't own",
                        userId, storyId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(FileUploadResponse.error("You can only upload covers for your own stories"));
            }

            // Delete old cover image if exists
            if (story.getCoverImageUrl() != null) {
                try {
                    fileUploadService.deleteImage(story.getCoverImageUrl());
                } catch (Exception e) {
                    log.warn("Failed to delete old story cover: {}", story.getCoverImageUrl(), e);
                }
            }

            // Upload new image
            String imageUrl = fileUploadService.uploadImage(file, "story_covers");

            // Update story cover image
            UpdateStoryRequest updateRequest = new UpdateStoryRequest();
            updateRequest.setCoverImageUrl(imageUrl);
            storyService.updateStory(UUID.fromString(storyId), updateRequest, userId);

            log.info("Story cover uploaded successfully for story: {}", storyId);

            return ResponseEntity.ok(FileUploadResponse.success(
                    imageUrl,
                    fileUploadService.extractPublicIdFromUrl(imageUrl),
                    file.getSize(),
                    file.getOriginalFilename(),
                    "story_covers"));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid file upload request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(FileUploadResponse.error("Invalid file: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to upload story cover for story: {}", storyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(FileUploadResponse.error("Failed to upload image: " + e.getMessage()));
        }
    }

    @DeleteMapping("/image")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<FileUploadResponse> deleteImage(
            @RequestParam("imageUrl") String imageUrl,
            @RequestParam("type") String type,
            HttpServletRequest httpRequest) { // "profile" or "story"

        try {
            log.info("Deleting image: {} of type: {}", imageUrl, type);

            UUID userId = getCurrentUserId(httpRequest);

            // Verify ownership based on type
            if ("profile".equals(type)) {
                User user = authService.getCurrentUser(userId);
                if (!imageUrl.equals(user.getProfileImageUrl())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(FileUploadResponse.error("You can only delete your own profile image"));
                }
                // Clear profile image URL
                User updatedUser = User.builder()
                        .profileImageUrl(null)
                        .build();
                authService.updateProfile(userId, updatedUser);

            } else if ("story".equals(type)) {
                // For story covers, we need the story ID
                // This would be better implemented with a separate endpoint for story cover
                // deletion
                log.warn("Story cover deletion through generic endpoint - consider using story-specific endpoint");
            }

            // Delete from Cloudinary
            fileUploadService.deleteImage(imageUrl);

            log.info("Image deleted successfully: {}", imageUrl);

            return ResponseEntity.ok(FileUploadResponse.builder()
                    .success(true)
                    .message("Image deleted successfully")
                    .build());

        } catch (Exception e) {
            log.error("Failed to delete image: {}", imageUrl, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(FileUploadResponse.error("Failed to delete image: " + e.getMessage()));
        }
    }

    @GetMapping("/validation")
    public ResponseEntity<FileUploadResponse> validateFile(
            @RequestParam("filename") String filename,
            @RequestParam("size") Long size,
            @RequestParam("type") String contentType) {

        try {
            // Basic validation without actual file
            if (size > 10 * 1024 * 1024) { // 10MB
                return ResponseEntity.badRequest()
                        .body(FileUploadResponse.error("File size too large. Maximum size is 10MB."));
            }

            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                        .body(FileUploadResponse.error("Only image files are allowed."));
            }

            return ResponseEntity.ok(FileUploadResponse.builder()
                    .success(true)
                    .message("File validation passed")
                    .build());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(FileUploadResponse.error("Validation failed: " + e.getMessage()));
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