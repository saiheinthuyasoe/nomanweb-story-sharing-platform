package com.app.nomanweb_backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/redis")
@RequiredArgsConstructor
@Slf4j
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
}