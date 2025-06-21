package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.ReadingList;
import com.app.nomanweb_backend.repository.ReadingListRepository;
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
@RequestMapping("/api/reading-lists")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "https://nomanweb.vercel.app" })
public class ReadingListController {

    private final ReadingListRepository readingListRepository;
    private final StoryRepository storyRepository;
    private final UserRepository userRepository;

    @PostMapping("/story/{storyId}/bookmark")
    public ResponseEntity<?> toggleBookmark(@PathVariable UUID storyId,
            @RequestParam(defaultValue = "FAVORITE") String listType,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Story story = storyRepository.findById(storyId)
                    .orElseThrow(() -> new RuntimeException("Story not found"));

            ReadingList.ListType type = ReadingList.ListType.valueOf(listType.toUpperCase());

            // Check if bookmark already exists
            Optional<ReadingList> existingBookmark = readingListRepository
                    .findByUserIdAndStoryIdAndListType(user.getId(), storyId, type);

            Map<String, Object> response = new HashMap<>();

            if (existingBookmark.isPresent()) {
                // Remove bookmark
                readingListRepository.delete(existingBookmark.get());
                response.put("bookmarked", false);
                response.put("message", "Removed from " + type.name().toLowerCase());
            } else {
                // Add bookmark
                ReadingList readingList = ReadingList.builder()
                        .user(user)
                        .story(story)
                        .listType(type)
                        .build();
                readingListRepository.save(readingList);
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
            for (ReadingList.ListType type : ReadingList.ListType.values()) {
                listTypes.put(type.name().toLowerCase(), false);
            }
            response.put("listTypes", listTypes);

            // Check if user is authenticated
            if (authentication != null && authentication.isAuthenticated()) {
                String username = authentication.getName();
                User user = userRepository.findByUsername(username).orElse(null);

                if (user != null) {
                    List<ReadingList> bookmarks = readingListRepository.findByUserIdAndStoryId(user.getId(), storyId);
                    response.put("bookmarked", !bookmarks.isEmpty());

                    // Include all list types the story is in
                    for (ReadingList.ListType type : ReadingList.ListType.values()) {
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
    public ResponseEntity<?> getMyReadingLists(@RequestParam(required = false) String listType,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<ReadingList> readingLists;

            if (listType != null) {
                ReadingList.ListType type = ReadingList.ListType.valueOf(listType.toUpperCase());
                readingLists = readingListRepository.findByUserIdAndListTypeOrderByAddedAtDesc(user.getId(), type);
            } else {
                readingLists = readingListRepository.findByUserIdOrderByAddedAtDesc(user.getId());
            }

            return ResponseEntity.ok(readingLists);

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
            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Story story = storyRepository.findById(storyId)
                    .orElseThrow(() -> new RuntimeException("Story not found"));

            ReadingList.ListType newStatus = ReadingList.ListType.valueOf(status.toUpperCase());

            // Remove existing reading status entries
            readingListRepository.deleteByUserIdAndStoryIdAndListTypeIn(
                    user.getId(), storyId,
                    List.of(ReadingList.ListType.READING, ReadingList.ListType.COMPLETED,
                            ReadingList.ListType.WANT_TO_READ));

            // Add new status
            ReadingList readingList = ReadingList.builder()
                    .user(user)
                    .story(story)
                    .listType(newStatus)
                    .build();
            readingListRepository.save(readingList);

            return ResponseEntity.ok(Map.of(
                    "message", "Reading status updated to " + newStatus.name().toLowerCase(),
                    "status", newStatus.name()));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to update reading status: " + e.getMessage()));
        }
    }
}