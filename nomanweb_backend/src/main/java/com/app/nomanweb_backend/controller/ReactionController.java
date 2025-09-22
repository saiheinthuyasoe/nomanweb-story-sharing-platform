package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.Reaction;
import com.app.nomanweb_backend.repository.ReactionRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.ChapterRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.service.NotificationService;
import com.app.nomanweb_backend.controller.UserController;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/reactions")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
public class ReactionController {

        private final ReactionRepository reactionRepository;
        private final StoryRepository storyRepository;
        private final ChapterRepository chapterRepository;
        private final UserRepository userRepository;
        private final NotificationService notificationService;

        @PostMapping("/story/{storyId}/like")
        @Transactional
        public ResponseEntity<?> toggleStoryLike(@PathVariable UUID storyId, Authentication authentication) {
                try {
                        // Check authentication first
                        if (authentication == null || !authentication.isAuthenticated()) {
                                return ResponseEntity.status(401)
                                                .body(Map.of("error", "Authentication required to like stories"));
                        }

                        String userIdStr = authentication.getName();
                        if (userIdStr == null || userIdStr.isEmpty()) {
                                return ResponseEntity.status(401)
                                                .body(Map.of("error", "Invalid authentication token"));
                        }

                        UUID userId = UUID.fromString(userIdStr);
                        System.out.println("User " + userId + " trying to like story: " + storyId);

                        User user = userRepository.findById(userId)
                                        .orElseThrow(() -> new RuntimeException("User not found: " + userId));

                        Story story = storyRepository.findById(storyId)
                                        .orElseThrow(() -> new RuntimeException("Story not found: " + storyId));

                        // Check if reaction already exists
                        boolean exists = reactionRepository.existsByUserIdAndTargetTypeAndTargetId(
                                        user.getId(), Reaction.TargetType.STORY, storyId);

                        Map<String, Object> response = new HashMap<>();

                        if (exists) {
                                // Unlike - remove reaction
                                reactionRepository.deleteByUserIdAndTargetTypeAndTargetId(
                                                user.getId(), Reaction.TargetType.STORY, storyId);
                                story.decrementLikes();
                                storyRepository.save(story);
                                response.put("liked", false);
                                response.put("message", "Story unliked");
                                System.out.println("User " + user.getUsername() + " unliked story: " + storyId);

                                // Broadcast real-time update for story unlike
                                Map<String, Object> unlikeData = new HashMap<>();
                                unlikeData.put("storyId", storyId);
                                unlikeData.put("userId", user.getId());
                                unlikeData.put("liked", false);
                                UserController.broadcastSocialUpdate(story.getAuthor().getId(), "story_unliked",
                                                unlikeData);
                        } else {
                                // Like - add reaction
                                Reaction reaction = Reaction.builder()
                                                .user(user)
                                                .targetType(Reaction.TargetType.STORY)
                                                .targetId(storyId)
                                                .reactionType(Reaction.ReactionType.LIKE)
                                                .build();
                                reactionRepository.save(reaction);
                                story.incrementLikes();
                                storyRepository.save(story);

                                // Send notification to story author
                                notificationService.notifyStoryLike(story.getAuthor().getId(), user.getId(), storyId);

                                response.put("liked", true);
                                response.put("message", "Story liked");
                                System.out.println("User " + user.getUsername() + " liked story: " + storyId);

                                // Broadcast real-time update for story like
                                Map<String, Object> likeData = new HashMap<>();
                                likeData.put("storyId", storyId);
                                likeData.put("userId", user.getId());
                                likeData.put("liked", true);
                                UserController.broadcastSocialUpdate(story.getAuthor().getId(), "story_liked",
                                                likeData);
                        }

                        response.put("totalLikes", story.getTotalLikes());
                        return ResponseEntity.ok(response);

                } catch (Exception e) {
                        System.err.println("Error in toggleStoryLike: " + e.getMessage());
                        e.printStackTrace();
                        return ResponseEntity.badRequest()
                                        .body(Map.of("error", "Failed to toggle like: " + e.getMessage()));
                }
        }

        @PostMapping("/chapter/{chapterId}/like")
        @Transactional
        public ResponseEntity<?> toggleChapterLike(@PathVariable UUID chapterId, Authentication authentication) {
                try {
                        String userIdStr = authentication.getName();
                        UUID userId = UUID.fromString(userIdStr);
                        User user = userRepository.findById(userId)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        Chapter chapter = chapterRepository.findById(chapterId)
                                        .orElseThrow(() -> new RuntimeException("Chapter not found"));

                        // Check if reaction already exists
                        boolean exists = reactionRepository.existsByUserIdAndTargetTypeAndTargetId(
                                        user.getId(), Reaction.TargetType.CHAPTER, chapterId);

                        Map<String, Object> response = new HashMap<>();

                        if (exists) {
                                // Unlike - remove reaction
                                reactionRepository.deleteByUserIdAndTargetTypeAndTargetId(
                                                user.getId(), Reaction.TargetType.CHAPTER, chapterId);
                                chapter.decrementLikes();
                                chapterRepository.save(chapter);
                                response.put("liked", false);
                                response.put("message", "Chapter unliked");
                        } else {
                                // Like - add reaction
                                Reaction reaction = Reaction.builder()
                                                .user(user)
                                                .targetType(Reaction.TargetType.CHAPTER)
                                                .targetId(chapterId)
                                                .reactionType(Reaction.ReactionType.LIKE)
                                                .build();
                                reactionRepository.save(reaction);
                                chapter.incrementLikes();
                                chapterRepository.save(chapter);

                                // Send notification to chapter author
                                notificationService.notifyChapterLike(chapter.getStory().getAuthor().getId(),
                                                user.getId(), chapterId);

                                response.put("liked", true);
                                response.put("message", "Chapter liked");
                        }

                        response.put("totalLikes", chapter.getLikes());
                        return ResponseEntity.ok(response);

                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("error", "Failed to toggle like: " + e.getMessage()));
                }
        }

        @GetMapping("/story/{storyId}/status")
        public ResponseEntity<?> getStoryReactionStatus(@PathVariable UUID storyId, Authentication authentication) {
                try {
                        long totalLikes = reactionRepository.countByTargetTypeAndTargetId(
                                        Reaction.TargetType.STORY, storyId);

                        boolean isLiked = false;

                        // Check if user is authenticated
                        if (authentication != null && authentication.isAuthenticated()) {
                                String userIdStr = authentication.getName();
                                try {
                                        UUID userId = UUID.fromString(userIdStr);
                                        User user = userRepository.findById(userId).orElse(null);

                                        if (user != null) {
                                                isLiked = reactionRepository.existsByUserIdAndTargetTypeAndTargetId(
                                                                user.getId(), Reaction.TargetType.STORY, storyId);
                                        }
                                } catch (IllegalArgumentException e) {
                                        // Invalid UUID format, skip authentication check
                                }
                        }

                        return ResponseEntity.ok(Map.of(
                                        "liked", isLiked,
                                        "totalLikes", totalLikes));

                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("error", "Failed to get reaction status: " + e.getMessage()));
                }
        }

        @GetMapping("/chapter/{chapterId}/status")
        public ResponseEntity<?> getChapterReactionStatus(@PathVariable UUID chapterId, Authentication authentication) {
                try {
                        System.out.println("Getting chapter reaction status for chapter: " + chapterId);
                        long totalLikes = reactionRepository.countByTargetTypeAndTargetId(
                                        Reaction.TargetType.CHAPTER, chapterId);

                        boolean isLiked = false;

                        // Check if user is authenticated
                        if (authentication != null && authentication.isAuthenticated()) {
                                String userIdStr = authentication.getName();
                                try {
                                        UUID userId = UUID.fromString(userIdStr);
                                        User user = userRepository.findById(userId).orElse(null);

                                        if (user != null) {
                                                isLiked = reactionRepository.existsByUserIdAndTargetTypeAndTargetId(
                                                                user.getId(), Reaction.TargetType.CHAPTER, chapterId);
                                        }
                                } catch (IllegalArgumentException e) {
                                        // Invalid UUID format, skip authentication check
                                }
                        }

                        return ResponseEntity.ok(Map.of(
                                        "liked", isLiked,
                                        "totalLikes", totalLikes));

                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("error", "Failed to get reaction status: " + e.getMessage()));
                }
        }
}