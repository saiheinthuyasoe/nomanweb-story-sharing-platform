package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.service.CachedStoryService;
import com.app.nomanweb_backend.service.CacheWarmupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cache")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
public class CacheManagementController {

    private final CachedStoryService cachedStoryService;
    private final CacheWarmupService cacheWarmupService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getCacheStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Check cache status
            String warmupStatus = cacheWarmupService.getCacheWarmupStatus();
            
            // Check individual cache entries
            boolean trendingCached = cachedStoryService.getTrendingStoriesFromCache(0, 20) != null;
            boolean featuredCached = cachedStoryService.getFeaturedStoriesFromCache(0, 20) != null;
            boolean popularCached = cachedStoryService.getPopularStoriesFromCache(0, 20) != null;
            
            Map<String, Boolean> cacheDetails = new HashMap<>();
            cacheDetails.put("trending", trendingCached);
            cacheDetails.put("featured", featuredCached);
            cacheDetails.put("popular", popularCached);
            
            response.put("status", "success");
            response.put("warmupStatus", warmupStatus);
            response.put("cacheDetails", cacheDetails);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting cache status", e);
            response.put("status", "error");
            response.put("message", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/warmup")
    public ResponseEntity<Map<String, Object>> warmupCaches() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            cacheWarmupService.manualCacheWarmup();
            
            response.put("status", "success");
            response.put("message", "Cache warmup initiated");
            response.put("timestamp", System.currentTimeMillis());
            
            log.info("Manual cache warmup initiated via API");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error initiating cache warmup", e);
            response.put("status", "error");
            response.put("message", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshCaches() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            cacheWarmupService.refreshAllCaches();
            
            response.put("status", "success");
            response.put("message", "Cache refresh initiated");
            response.put("timestamp", System.currentTimeMillis());
            
            log.info("Cache refresh initiated via API");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error initiating cache refresh", e);
            response.put("status", "error");
            response.put("message", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/invalidate/trending")
    public ResponseEntity<Map<String, Object>> invalidateTrendingCache() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            cachedStoryService.invalidateTrendingStoriesCache();
            
            response.put("status", "success");
            response.put("message", "Trending stories cache invalidated");
            response.put("timestamp", System.currentTimeMillis());
            
            log.info("Trending stories cache invalidated via API");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error invalidating trending cache", e);
            response.put("status", "error");
            response.put("message", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/invalidate/featured")
    public ResponseEntity<Map<String, Object>> invalidateFeaturedCache() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            cachedStoryService.invalidateFeaturedStoriesCache();
            
            response.put("status", "success");
            response.put("message", "Featured stories cache invalidated");
            response.put("timestamp", System.currentTimeMillis());
            
            log.info("Featured stories cache invalidated via API");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error invalidating featured cache", e);
            response.put("status", "error");
            response.put("message", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/invalidate/popular")
    public ResponseEntity<Map<String, Object>> invalidatePopularCache() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            cachedStoryService.invalidatePopularStoriesCache();
            
            response.put("status", "success");
            response.put("message", "Popular stories cache invalidated");
            response.put("timestamp", System.currentTimeMillis());
            
            log.info("Popular stories cache invalidated via API");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error invalidating popular cache", e);
            response.put("status", "error");
            response.put("message", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/invalidate/all")
    public ResponseEntity<Map<String, Object>> invalidateAllCaches() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            cachedStoryService.invalidateAllStoryCaches();
            
            response.put("status", "success");
            response.put("message", "All story caches invalidated");
            response.put("timestamp", System.currentTimeMillis());
            
            log.info("All story caches invalidated via API");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error invalidating all caches", e);
            response.put("status", "error");
            response.put("message", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
    }
}