package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.repository.StoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/insights")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminInsightsController {

    private final StoryRepository storyRepository;

    @GetMapping("/top-rated")
    public ResponseEntity<List<Map<String, Object>>> getTopRatedBooks(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            log.info("Getting top-rated books with limit: {}", limit);
            
            Pageable pageable = PageRequest.of(0, limit);
            List<Story> stories = storyRepository.findBestRatedStories(
                Story.PublishStatus.PUBLISHED, pageable).getContent();
            
            List<Map<String, Object>> insights = stories.stream()
                .map(this::convertToBookInsight)
                .collect(Collectors.toList());
            
            log.info("Returning {} top-rated books", insights.size());
            return ResponseEntity.ok(insights);
        } catch (Exception e) {
            log.error("Error getting top-rated books", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/most-read-weekly")
    public ResponseEntity<List<Map<String, Object>>> getMostReadWeekly(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            log.info("Getting most read weekly books with limit: {}", limit);
            
            // Get weekly trending stories using existing repository method
            LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);
            Pageable pageable = PageRequest.of(0, limit);
            List<Story> stories = storyRepository.findWeeklyTrending(
                Story.PublishStatus.PUBLISHED, oneWeekAgo, pageable).getContent();
            
            // If not enough from this week, get most viewed overall
            if (stories.size() < limit) {
                stories = storyRepository.findTrendingStories(
                    Story.PublishStatus.PUBLISHED, pageable).getContent();
            }
            
            List<Map<String, Object>> insights = stories.stream()
                .map(this::convertToBookInsight)
                .collect(Collectors.toList());
            
            log.info("Returning {} most read weekly books", insights.size());
            return ResponseEntity.ok(insights);
        } catch (Exception e) {
            log.error("Error getting most read weekly books", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/new-releases")
    public ResponseEntity<List<Map<String, Object>>> getNewReleases(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            log.info("Getting new releases with limit: {}", limit);
            
            Pageable pageable = PageRequest.of(0, limit);
            List<Story> stories = storyRepository.findNewestStories(
                Story.PublishStatus.PUBLISHED, pageable).getContent();
            
            List<Map<String, Object>> insights = stories.stream()
                .map(this::convertToBookInsight)
                .collect(Collectors.toList());
            
            log.info("Returning {} new releases", insights.size());
            return ResponseEntity.ok(insights);
        } catch (Exception e) {
            log.error("Error getting new releases", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<Map<String, Object>>> getSuggestions(
            @RequestParam String sectionType,
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Integer minViews) {
        try {
            log.info("Getting suggestions for section: {} with limit: {}", sectionType, limit);
            
            List<Map<String, Object>> suggestions;
            
            switch (sectionType.toUpperCase()) {
                case "TOP_RATED":
                    suggestions = getTopRatedBooks(limit).getBody();
                    break;
                case "MOST_READ_WEEKLY":
                    suggestions = getMostReadWeekly(limit).getBody();
                    break;
                case "NEW_RELEASES":
                    suggestions = getNewReleases(limit).getBody();
                    break;
                default:
                    // Default to new releases
                    suggestions = getNewReleases(limit).getBody();
                    break;
            }
            
            // Apply additional filters if provided
            if (suggestions != null) {
                if (minRating != null) {
                    suggestions = suggestions.stream()
                        .filter(s -> ((Number) s.get("averageRating")).doubleValue() >= minRating)
                        .collect(Collectors.toList());
                }
                
                if (minViews != null) {
                    suggestions = suggestions.stream()
                        .filter(s -> ((Number) s.get("viewCount")).intValue() >= minViews)
                        .collect(Collectors.toList());
                }
            }
            
            log.info("Returning {} suggestions for section: {}", 
                suggestions != null ? suggestions.size() : 0, sectionType);
            return ResponseEntity.ok(suggestions != null ? suggestions : List.of());
        } catch (Exception e) {
            log.error("Error getting suggestions for section: {}", sectionType, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private Map<String, Object> convertToBookInsight(Story story) {
        Map<String, Object> insight = new HashMap<>();
        insight.put("id", story.getId().toString());
        insight.put("title", story.getTitle());
        insight.put("author", story.getAuthor() != null ? story.getAuthor().getDisplayName() : "Unknown");
        insight.put("authorId", story.getAuthor() != null ? story.getAuthor().getId().toString() : null);
        insight.put("description", story.getDescription());
        insight.put("coverImageUrl", story.getCoverImageUrl());
        insight.put("averageRating", 0.0); // TODO: Calculate average rating from reviews
        insight.put("viewCount", story.getTotalViews() != null ? story.getTotalViews() : 0);
        insight.put("likeCount", story.getTotalLikes() != null ? story.getTotalLikes() : 0);
        insight.put("createdAt", story.getCreatedAt());
        insight.put("updatedAt", story.getUpdatedAt());
        insight.put("category", story.getCategory() != null ? story.getCategory().getName() : null);
        insight.put("status", story.getBookStatus() != null ? story.getBookStatus().toString() : "DRAFT");
        insight.put("chapterCount", story.getTotalChapters() != null ? story.getTotalChapters() : 0);
        return insight;
    }
}