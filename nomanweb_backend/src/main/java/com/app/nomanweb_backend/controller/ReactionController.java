package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.Reaction;
import com.app.nomanweb_backend.repository.ReactionRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.ChapterRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/reactions")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "https://nomanweb.vercel.app" })
public class ReactionController {

        private final ReactionRepository reactionRepository;
        private final StoryRepository storyRepository;
        private final ChapterRepository chapterRepository;
        private final UserRepository userRepository;

        @PostMapping("/story/{storyId}/like")
        public ResponseEntity<?> toggleStoryLike(@PathVariable UUID storyId, Authentication authentication) {
                try {
                        String username = authentication.getName();
                        User user = userRepository.findByUsername(username)
                                        .orElseThrow(() -> new RuntimeException("User not found"));

                        Story story = storyRepository.findById(storyId)
                                        .orElseThrow(() -> new RuntimeException("Story not found"));

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
                                response.put("liked", true);
                                response.put("message", "Story liked");
                        }

                        response.put("totalLikes", story.getTotalLikes());
                        return ResponseEntity.ok(response);

                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("error", "Failed to toggle like: " + e.getMessage()));
                }
        }

        @PostMapping("/chapter/{chapterId}/like")
        public ResponseEntity<?> toggleChapterLike(@PathVariable UUID chapterId, Authentication authentication) {
                try {
                        String username = authentication.getName();
                        User user = userRepository.findByUsername(username)
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
                                String username = authentication.getName();
                                User user = userRepository.findByUsername(username).orElse(null);

                                if (user != null) {
                                        isLiked = reactionRepository.existsByUserIdAndTargetTypeAndTargetId(
                                                        user.getId(), Reaction.TargetType.STORY, storyId);
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
                                String username = authentication.getName();
                                User user = userRepository.findByUsername(username).orElse(null);

                                if (user != null) {
                                        isLiked = reactionRepository.existsByUserIdAndTargetTypeAndTargetId(
                                                        user.getId(), Reaction.TargetType.CHAPTER, chapterId);
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