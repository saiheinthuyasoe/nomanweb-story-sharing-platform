package com.app.nomanweb_backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/redis")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
public class RedisHealthController {

    private final RedisTemplate<String, Object> redisTemplate;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();

        try {
            // Test basic Redis connectivity
            String testKey = "health:test:" + UUID.randomUUID();
            String testValue = "Redis is working!";

            // Set a test value
            redisTemplate.opsForValue().set(testKey, testValue, Duration.ofMinutes(1));

            // Get the test value
            Object retrievedValue = redisTemplate.opsForValue().get(testKey);

            // Delete the test key
            redisTemplate.delete(testKey);

            boolean isWorking = testValue.equals(retrievedValue);

            response.put("status", isWorking ? "UP" : "DOWN");
            response.put("message", isWorking ? "Redis is working correctly" : "Redis test failed");
            response.put("testValue", retrievedValue);
            response.put("timestamp", System.currentTimeMillis());

            log.info("Redis health check: {}", isWorking ? "SUCCESS" : "FAILED");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Redis health check failed", e);
            response.put("status", "DOWN");
            response.put("message", "Redis connection failed: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.status(503).body(response);
        }
    }

    @PostMapping("/test-cache")
    public ResponseEntity<Map<String, Object>> testCache(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();

        try {
            String key = request.get("key");
            String value = request.get("value");

            if (key == null || value == null) {
                response.put("error", "Both key and value are required");
                return ResponseEntity.badRequest().body(response);
            }

            // Set value in Redis
            redisTemplate.opsForValue().set(key, value, Duration.ofMinutes(5));

            // Retrieve value from Redis
            Object retrievedValue = redisTemplate.opsForValue().get(key);

            response.put("success", true);
            response.put("key", key);
            response.put("originalValue", value);
            response.put("retrievedValue", retrievedValue);
            response.put("matches", value.equals(retrievedValue));
            response.put("timestamp", System.currentTimeMillis());

            log.info("Cache test completed for key: {}", key);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Cache test failed", e);
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.status(500).body(response);
        }
    }

        @GetMapping("/cache-stats")
    public ResponseEntity<Map<String, Object>> getCacheStats() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get Redis info
            var info = redisTemplate.getConnectionFactory()
                    .getConnection()
                    .info();
            
            response.put("success", true);
            response.put("redisInfo", info.toString());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to get cache stats", e);
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/cache-keys")
    public ResponseEntity<Map<String, Object>> getAllCacheKeys() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get all keys from Redis
            Set<String> keys = redisTemplate.keys("*");
            
            if (keys == null) {
                keys = new HashSet<>();
            }
            
            // Group keys by pattern/prefix for better organization
            Map<String, List<String>> keysByPattern = keys.stream()
                    .collect(Collectors.groupingBy(key -> {
                        if (key.contains(":")) {
                            return key.substring(0, key.indexOf(":"));
                        }
                        return "other";
                    }));
            
            response.put("success", true);
            response.put("totalKeys", keys.size());
            response.put("allKeys", keys);
            response.put("keysByPattern", keysByPattern);
            response.put("timestamp", System.currentTimeMillis());
            
            log.info("Retrieved {} cache keys from Redis", keys.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to get cache keys", e);
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/cache-entries")
    public ResponseEntity<Map<String, Object>> getAllCacheEntries() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get all keys from Redis
            Set<String> keys = redisTemplate.keys("*");
            
            if (keys == null) {
                keys = new HashSet<>();
            }
            
            // Get values for all keys (limit to first 100 to avoid memory issues)
            Map<String, Object> cacheEntries = new HashMap<>();
            List<String> keysList = new ArrayList<>(keys);
            
            // Limit to first 100 keys to avoid overwhelming response
            int limit = Math.min(keysList.size(), 100);
            
            for (int i = 0; i < limit; i++) {
                String key = keysList.get(i);
                try {
                    Object value = redisTemplate.opsForValue().get(key);
                    cacheEntries.put(key, value);
                } catch (Exception e) {
                    cacheEntries.put(key, "Error retrieving value: " + e.getMessage());
                }
            }
            
            response.put("success", true);
            response.put("totalKeys", keys.size());
            response.put("displayedEntries", limit);
            response.put("cacheEntries", cacheEntries);
            response.put("timestamp", System.currentTimeMillis());
            
            if (keys.size() > 100) {
                response.put("note", "Only showing first 100 entries. Total keys: " + keys.size());
            }
            
            log.info("Retrieved {} cache entries from Redis (showing {} entries)", keys.size(), limit);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to get cache entries", e);
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    @DeleteMapping("/cache-clear")
    public ResponseEntity<Map<String, Object>> clearAllCache() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get all keys first to count them
            Set<String> keys = redisTemplate.keys("*");
            int keyCount = keys != null ? keys.size() : 0;
            
            // Clear all cache
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
            
            response.put("success", true);
            response.put("clearedKeys", keyCount);
            response.put("message", "All cache entries cleared successfully");
            response.put("timestamp", System.currentTimeMillis());
            
            log.info("Cleared {} cache entries from Redis", keyCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to clear cache", e);
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
    }
}