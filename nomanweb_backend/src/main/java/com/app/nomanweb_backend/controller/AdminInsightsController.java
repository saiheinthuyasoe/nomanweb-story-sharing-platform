package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.Category;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.repository.CategoryRepository;
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
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001",
        "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminInsightsController {

    private final StoryRepository storyRepository;
    private final CategoryRepository categoryRepository;

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

    @GetMapping("/by-genre/{genreId}")
    public ResponseEntity<List<Map<String, Object>>> getBooksByGenre(
            @PathVariable String genreId,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            log.info("Getting books by genre: {} with limit: {}", genreId, limit);

            // Map genre names to category names/slugs
            String categoryName = mapGenreToCategory(genreId);

            // Find category by name or slug
            Category category = categoryRepository.findByName(categoryName)
                    .or(() -> categoryRepository.findBySlug(genreId))
                    .orElse(null);

            if (category == null) {
                log.warn("Category not found for genre: {}", genreId);
                return ResponseEntity.ok(List.of());
            }

            Pageable pageable = PageRequest.of(0, limit, Sort.by("totalViews").descending());
            List<Story> stories = storyRepository.findByCategoryIdAndPublishStatus(
                    category.getId(), Story.PublishStatus.PUBLISHED, pageable).getContent();

            List<Map<String, Object>> insights = stories.stream()
                    .map(this::convertToBookInsight)
                    .collect(Collectors.toList());

            log.info("Returning {} books for genre: {}", insights.size(), genreId);
            return ResponseEntity.ok(insights);
        } catch (Exception e) {
            log.error("Error getting books by genre: {}", genreId, e);
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
                case "BEST_RATING":
                    suggestions = getTopRatedBooks(limit).getBody();
                    break;
                case "MOST_READ_WEEKLY":
                case "WEEKLY_FEATURES":
                    suggestions = getMostReadWeekly(limit).getBody();
                    break;
                case "NEW_RELEASES":
                    suggestions = getNewReleases(limit).getBody();
                    break;
                case "RECOMMENDED_FOR_YOU":
                case "RECOMMENDED":
                    // Use top rated as fallback for recommended
                    suggestions = getTopRatedBooks(limit).getBody();
                    break;
                case "BEST_OF_ALL_TIME":
                    // Use top rated for best of all time
                    suggestions = getTopRatedBooks(limit).getBody();
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

    private String mapGenreToCategory(String genreId) {
        // Map frontend genre IDs to backend category names
        switch (genreId.toLowerCase()) {
            case "fantasy":
                return "Fantasy";
            case "romance":
                return "Romance";
            case "mystery":
                return "Mystery";
            case "sci-fi":
            case "science-fiction":
                return "Science Fiction";
            case "adventure":
                return "Adventure";
            case "thriller":
                return "Thriller";
            case "horror":
                return "Horror";
            case "comedy":
                return "Comedy";
            case "drama":
                return "Drama";
            case "young-adult":
                return "Young Adult";
            default:
                return genreId; // Fallback to original genre ID
        }
    }

    private Map<String, Object> convertToBookInsight(Story story) {
        Map<String, Object> insight = new HashMap<>();
        insight.put("id", story.getId().toString());
        insight.put("title", story.getTitle());

        // Create author object with displayName and username
        Map<String, String> author = new HashMap<>();
        author.put("displayName", story.getAuthor() != null ? story.getAuthor().getDisplayName() : "Unknown");
        author.put("username", story.getAuthor() != null ? story.getAuthor().getUsername() : "unknown");
        insight.put("author", author);

        insight.put("coverImageUrl", story.getCoverImageUrl());

        // Create category object with id and name
        if (story.getCategory() != null) {
            Map<String, String> category = new HashMap<>();
            category.put("id", story.getCategory().getSlug());
            category.put("name", story.getCategory().getName());
            insight.put("category", category);
        }

        Long totalViews = story.getTotalViews() != null ? story.getTotalViews() : 0L;
        Long totalLikes = story.getTotalLikes() != null ? story.getTotalLikes() : 0L;

        insight.put("totalViews", totalViews);
        insight.put("totalLikes", totalLikes);

        // Calculate rating based on likes-to-views ratio (0.0 to 5.0 scale)
        double averageRating = 0.0;
        if (totalViews > 0 && totalLikes > 0) {
            // Convert likes/views ratio to 5-star scale
            double ratio = (double) totalLikes / totalViews;
            // Scale the ratio to 5-star system (assuming max 20% like rate = 5 stars)
            averageRating = Math.min(5.0, ratio * 25.0);
            // Round to 1 decimal place
            averageRating = Math.round(averageRating * 10.0) / 10.0;
        }
        insight.put("averageRating", averageRating);

        insight.put("chapterCount", story.getTotalChapters() != null ? story.getTotalChapters() : 0);
        insight.put("publishedAt",
                story.getPublishedAt() != null ? story.getPublishedAt().toString() : story.getCreatedAt().toString());
        insight.put("weeklyViews", 0); // TODO: Calculate weekly views
        insight.put("weeklyLikes", 0); // TODO: Calculate weekly likes
        insight.put("trendingScore", 0); // TODO: Calculate trending score

        return insight;
    }
}