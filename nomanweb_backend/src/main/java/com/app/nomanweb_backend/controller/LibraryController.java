package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.Library;
import com.app.nomanweb_backend.repository.LibraryRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/libraries")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "https://nomanweb.vercel.app" })
public class LibraryController {

    private final LibraryRepository libraryRepository;
    private final StoryRepository storyRepository;
    private final UserRepository userRepository;

    @PostMapping("/story/{storyId}/bookmark")
    public ResponseEntity<?> toggleBookmark(@PathVariable UUID storyId,
            @RequestParam(defaultValue = "LIKE") String listType,
            Authentication authentication) {
        try {
            String userIdStr = authentication.getName();
            UUID userId = UUID.fromString(userIdStr);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Story story = storyRepository.findById(storyId)
                    .orElseThrow(() -> new RuntimeException("Story not found"));

            // Handle special "REMOVE" case
            if ("REMOVE".equals(listType.toUpperCase())) {
                // Remove all bookmarks for this story
                List<Library> allBookmarks = libraryRepository.findByUserIdAndStoryId(user.getId(), storyId);
                libraryRepository.deleteAll(allBookmarks);

                return ResponseEntity.ok(Map.of(
                        "bookmarked", false,
                        "message", "Removed from library",
                        "listType", "REMOVED"));
            }

            Library.ListType type = Library.ListType.valueOf(listType.toUpperCase());

            // Check if bookmark already exists
            Optional<Library> existingBookmark = libraryRepository
                    .findByUserIdAndStoryIdAndListType(user.getId(), storyId, type);

            Map<String, Object> response = new HashMap<>();

            if (existingBookmark.isPresent()) {
                // Remove bookmark
                libraryRepository.delete(existingBookmark.get());

                // Update story counts
                updateStoryCountsOnRemove(story, type);
                storyRepository.save(story);

                response.put("bookmarked", false);
                response.put("message", "Removed from " + type.name().toLowerCase());
            } else {
                // Add bookmark
                Library library = Library.builder()
                        .user(user)
                        .story(story)
                        .listType(type)
                        .build();
                libraryRepository.save(library);

                // Update story counts
                updateStoryCountsOnAdd(story, type);
                storyRepository.save(story);

                response.put("bookmarked", true);
                response.put("message", "Added to " + type.name().toLowerCase());
            }

            response.put("listType", type.name());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to toggle bookmark: " + e.getMessage()));
        }
    }

    @GetMapping("/story/{storyId}/status")
    public ResponseEntity<?> getBookmarkStatus(@PathVariable UUID storyId, Authentication authentication) {
        try {
            System.out.println("Getting bookmark status for story: " + storyId);
            Map<String, Object> response = new HashMap<>();

            // Default values for non-authenticated users
            response.put("bookmarked", false);
            Map<String, Boolean> listTypes = new HashMap<>();
            for (Library.ListType type : Library.ListType.values()) {
                listTypes.put(type.name().toLowerCase(), false);
            }
            response.put("listTypes", listTypes);

            // Check if user is authenticated
            if (authentication != null && authentication.isAuthenticated()) {
                String userIdStr = authentication.getName();
                UUID userId = UUID.fromString(userIdStr);
                User user = userRepository.findById(userId).orElse(null);

                if (user != null) {
                    List<Library> bookmarks = libraryRepository.findByUserIdAndStoryId(user.getId(), storyId);
                    response.put("bookmarked", !bookmarks.isEmpty());

                    // Include all list types the story is in
                    for (Library.ListType type : Library.ListType.values()) {
                        listTypes.put(type.name().toLowerCase(),
                                bookmarks.stream().anyMatch(b -> b.getListType() == type));
                    }
                    response.put("listTypes", listTypes);
                }
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to get bookmark status: " + e.getMessage()));
        }
    }

    @GetMapping("/my-lists")
    public ResponseEntity<?> getMyLibraries(@RequestParam(required = false) String listType,
            Authentication authentication) {
        try {
            String userIdStr = authentication.getName();
            UUID userId = UUID.fromString(userIdStr);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Library> libraries;

            if (listType != null) {
                try {
                    Library.ListType type = Library.ListType.valueOf(listType.toUpperCase());
                    libraries = libraryRepository.findByUserIdAndListTypeOrderByAddedAtDesc(user.getId(), type);
                } catch (IllegalArgumentException e) {
                    // Invalid list type, return empty list
                    libraries = new java.util.ArrayList<>();
                }
            } else {
                libraries = libraryRepository.findByUserIdOrderByAddedAtDesc(user.getId());
            }

            return ResponseEntity.ok(libraries);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to get reading lists: " + e.getMessage()));
        }
    }

    @PostMapping("/story/{storyId}/reading-status")
    public ResponseEntity<?> updateReadingStatus(@PathVariable UUID storyId,
            @RequestParam String status,
            Authentication authentication) {
        try {
            String userIdStr = authentication.getName();
            UUID userId = UUID.fromString(userIdStr);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Story story = storyRepository.findById(storyId)
                    .orElseThrow(() -> new RuntimeException("Story not found"));

            // Handle special "REMOVE" case
            if ("REMOVE".equals(status.toUpperCase())) {
                // Get existing reading status entries before removing them
                List<Library> existingStatuses = libraryRepository.findByUserIdAndStoryId(user.getId(), storyId)
                        .stream()
                        .filter(lib -> lib.getListType() == Library.ListType.READING ||
                                lib.getListType() == Library.ListType.COMPLETED ||
                                lib.getListType() == Library.ListType.WANT_TO_READ)
                        .toList();

                // Update counts for removed statuses
                for (Library existingStatus : existingStatuses) {
                    updateStoryCountsOnRemove(story, existingStatus.getListType());
                }

                // Remove existing reading status entries
                libraryRepository.deleteByUserIdAndStoryIdAndListTypeIn(
                        user.getId(), storyId,
                        List.of(Library.ListType.READING, Library.ListType.COMPLETED,
                                Library.ListType.WANT_TO_READ));

                storyRepository.save(story);

                return ResponseEntity.ok(Map.of(
                        "message", "Removed from reading lists",
                        "status", "REMOVED"));
            }

            Library.ListType newStatus = Library.ListType.valueOf(status.toUpperCase());

            // Get existing reading status entries before removing them
            List<Library> existingStatuses = libraryRepository.findByUserIdAndStoryId(user.getId(), storyId)
                    .stream()
                    .filter(lib -> lib.getListType() == Library.ListType.READING ||
                            lib.getListType() == Library.ListType.COMPLETED ||
                            lib.getListType() == Library.ListType.WANT_TO_READ)
                    .toList();

            // Update counts for removed statuses
            for (Library existingStatus : existingStatuses) {
                updateStoryCountsOnRemove(story, existingStatus.getListType());
            }

            // Remove existing reading status entries
            libraryRepository.deleteByUserIdAndStoryIdAndListTypeIn(
                    user.getId(), storyId,
                    List.of(Library.ListType.READING, Library.ListType.COMPLETED,
                            Library.ListType.WANT_TO_READ));

            // Add new status
            Library library = Library.builder()
                    .user(user)
                    .story(story)
                    .listType(newStatus)
                    .build();
            libraryRepository.save(library);

            // Update counts for new status
            updateStoryCountsOnAdd(story, newStatus);
            storyRepository.save(story);

            return ResponseEntity.ok(Map.of(
                    "message", "Reading status updated to " + newStatus.name().toLowerCase(),
                    "status", newStatus.name()));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to update reading status: " + e.getMessage()));
        }
    }

    private void updateStoryCountsOnAdd(Story story, Library.ListType listType) {
        switch (listType) {
            case WANT_TO_READ:
                story.incrementWantToRead();
                break;
            case COMPLETED:
                story.incrementCompleted();
                break;
            case READING:
                story.incrementCurrentlyReading();
                break;
            // LIKE is handled separately in ReactionController
            // PURCHASED and HISTORY don't need count tracking
            default:
                break;
        }
    }

    private void updateStoryCountsOnRemove(Story story, Library.ListType listType) {
        switch (listType) {
            case WANT_TO_READ:
                story.decrementWantToRead();
                break;
            case COMPLETED:
                story.decrementCompleted();
                break;
            case READING:
                story.decrementCurrentlyReading();
                break;
            // LIKE is handled separately in ReactionController
            // PURCHASED and HISTORY don't need count tracking
            default:
                break;
        }
    }
}