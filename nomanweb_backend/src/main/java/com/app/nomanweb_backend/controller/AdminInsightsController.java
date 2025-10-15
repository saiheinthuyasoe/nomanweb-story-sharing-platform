package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.service.CachedInsightsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/insights")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001",
        "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminInsightsController {

    private final CachedInsightsService cachedInsightsService;

    @GetMapping("/top-rated")
    public ResponseEntity<List<Map<String, Object>>> getTopRatedBooks(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            log.info("Getting top-rated books with limit: {} (using cache)", limit);
            List<Map<String, Object>> insights = cachedInsightsService.getTopRatedBooksCached(limit);
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
            log.info("Getting most read weekly books with limit: {} (using cache)", limit);
            List<Map<String, Object>> insights = cachedInsightsService.getMostReadWeeklyCached(limit);
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
            log.info("Getting new releases with limit: {} (using cache)", limit);
            List<Map<String, Object>> insights = cachedInsightsService.getNewReleasesCached(limit);
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
            log.info("Getting books by genre: {} with limit: {} (using cache)", genreId, limit);
            List<Map<String, Object>> insights = cachedInsightsService.getBooksByGenreCached(genreId, limit);
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
            log.info("Getting suggestions for section: {} with limit: {} (using cache)", sectionType, limit);
            List<Map<String, Object>> suggestions = cachedInsightsService.getSuggestionsCached(
                    sectionType, limit, genre, minRating, minViews);
            log.info("Returning {} suggestions for section: {}", suggestions.size(), sectionType);
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            log.error("Error getting suggestions for section: {}", sectionType, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getInsightsDashboard() {
        try {
            log.info("Getting comprehensive insights dashboard (using cache)");
            Map<String, Object> dashboardData = cachedInsightsService.getInsightsDashboardCached();
            log.info("Returning comprehensive insights dashboard");
            return ResponseEntity.ok(dashboardData);
        } catch (Exception e) {
            log.error("Error getting insights dashboard", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}