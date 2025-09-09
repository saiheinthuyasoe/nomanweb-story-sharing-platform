package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.FeaturedContent;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.service.FeaturedContentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/homepage")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
@Slf4j
public class HomepageController {

    private final FeaturedContentService featuredContentService;

    @GetMapping("/sections/{sectionType}")
    public ResponseEntity<Page<Story>> getStoriesForSection(
            @PathVariable String sectionType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            FeaturedContent.SectionType section = FeaturedContent.SectionType.valueOf(sectionType.toUpperCase());
            Page<Story> stories = featuredContentService.getStoriesForSection(section, page, size);
            return ResponseEntity.ok(stories);
        } catch (IllegalArgumentException e) {
            log.error("Invalid section type: {}", sectionType);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error getting stories for section: {}", sectionType, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/new-releases")
    public ResponseEntity<Page<Story>> getNewReleases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.NEW_RELEASES, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting new releases", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/best-rating")
    public ResponseEntity<Page<Story>> getBestRating(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.BEST_RATING, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting best rating stories", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/weekly-features")
    public ResponseEntity<Page<Story>> getWeeklyFeatures(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.WEEKLY_FEATURES, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting weekly features", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/best-of-all-time")
    public ResponseEntity<Page<Story>> getBestOfAllTime(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.BEST_OF_ALL_TIME, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting best of all time stories", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/recommended")
    public ResponseEntity<Page<Story>> getRecommended(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.RECOMMENDED_FOR_YOU, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting recommended stories", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Page<Story>> getStoriesByCategory(
            @PathVariable UUID categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesByCategory(categoryId, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting stories by category: {}", categoryId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/all-sections")
    public ResponseEntity<Map<String, Page<Story>>> getAllHomepageSections(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {
        try {
            Map<String, Page<Story>> sections = new HashMap<>();

            sections.put("newReleases",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.NEW_RELEASES, page, size));
            sections.put("bestRating",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.BEST_RATING, page, size));
            sections.put("weeklyFeatures",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.WEEKLY_FEATURES, page,
                            size));
            sections.put("bestOfAllTime",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.BEST_OF_ALL_TIME, page,
                            size));
            sections.put("recommended",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.RECOMMENDED_FOR_YOU, page, size));

            return ResponseEntity.ok(sections);
        } catch (Exception e) {
            log.error("Error getting all homepage sections", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/section-stats")
    public ResponseEntity<Map<String, Object>> getSectionStats() {
        try {
            Map<String, Object> stats = new HashMap<>();

            for (FeaturedContent.SectionType sectionType : FeaturedContent.SectionType.values()) {
                long count = featuredContentService.getActiveFeaturedCount(sectionType);
                stats.put(sectionType.name().toLowerCase(), count);
            }

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting section stats", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}