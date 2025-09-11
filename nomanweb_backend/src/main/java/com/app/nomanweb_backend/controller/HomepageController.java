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

    @GetMapping("/carousel")
    public ResponseEntity<Page<Story>> getCarouselStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.HOMEPAGE_CAROUSEL, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting carousel stories", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Genre-specific endpoints
    @GetMapping("/adventure")
    public ResponseEntity<Page<Story>> getAdventureStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.ADVENTURE, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting adventure stories", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/comedy")
    public ResponseEntity<Page<Story>> getComedyStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.COMEDY, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting comedy stories", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/drama")
    public ResponseEntity<Page<Story>> getDramaStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.DRAMA, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting drama stories", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/fantasy")
    public ResponseEntity<Page<Story>> getFantasyStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.FANTASY, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting fantasy stories", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/horror")
    public ResponseEntity<Page<Story>> getHorrorStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.HORROR, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting horror stories", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/mystery")
    public ResponseEntity<Page<Story>> getMysteryStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.MYSTERY, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting mystery stories", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/romance")
    public ResponseEntity<Page<Story>> getRomanceStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.ROMANCE, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting romance stories", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/science-fiction")
    public ResponseEntity<Page<Story>> getScienceFictionStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.SCIENCE_FICTION, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting science fiction stories", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/thriller")
    public ResponseEntity<Page<Story>> getThrillerStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.THRILLER, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting thriller stories", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/young-adult")
    public ResponseEntity<Page<Story>> getYoungAdultStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        try {
            Page<Story> stories = featuredContentService.getStoriesForSection(
                    FeaturedContent.SectionType.YOUNG_ADULT, page, size);
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error getting young adult stories", e);
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
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.RECOMMENDED_FOR_YOU, page,
                            size));
            sections.put("homepageCarousel",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.HOMEPAGE_CAROUSEL, page,
                            size));

            // Genre sections
            sections.put("adventure",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.ADVENTURE, page, size));
            sections.put("comedy",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.COMEDY, page, size));
            sections.put("drama",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.DRAMA, page, size));
            sections.put("fantasy",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.FANTASY, page, size));
            sections.put("horror",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.HORROR, page, size));
            sections.put("mystery",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.MYSTERY, page, size));
            sections.put("romance",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.ROMANCE, page, size));
            sections.put("scienceFiction",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.SCIENCE_FICTION, page,
                            size));
            sections.put("thriller",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.THRILLER, page, size));
            sections.put("youngAdult",
                    featuredContentService.getStoriesForSection(FeaturedContent.SectionType.YOUNG_ADULT, page, size));

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