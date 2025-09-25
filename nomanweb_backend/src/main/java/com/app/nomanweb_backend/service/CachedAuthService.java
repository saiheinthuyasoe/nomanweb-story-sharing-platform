package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CachedAuthService {

    private final AuthService authService;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String USER_CACHE_PREFIX = "user:profile:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(30); // 30 minutes cache

    @Cacheable(value = "userProfiles", key = "#userId")
    public User getCurrentUserCached(UUID userId) {
        log.info("Fetching user profile from database for user: {}", userId);
        User user = authService.getCurrentUser(userId);

        // Also store in Redis with TTL
        String cacheKey = USER_CACHE_PREFIX + userId;
        redisTemplate.opsForValue().set(cacheKey, user, CACHE_TTL);

        return user;
    }

    @CachePut(value = "userProfiles", key = "#userId")
    public User updateProfileCached(UUID userId, User updateData) {
        log.info("Updating user profile and cache for user: {}", userId);
        User updatedUser = authService.updateProfile(userId, updateData);

        // Update Redis cache
        String cacheKey = USER_CACHE_PREFIX + userId;
        redisTemplate.opsForValue().set(cacheKey, updatedUser, CACHE_TTL);

        return updatedUser;
    }

    @CacheEvict(value = "userProfiles", key = "#userId")
    public void invalidateUserCache(UUID userId) {
        log.info("Invalidating user cache for user: {}", userId);
        String cacheKey = USER_CACHE_PREFIX + userId;
        redisTemplate.delete(cacheKey);
    }

    public User getUserFromCache(UUID userId) {
        String cacheKey = USER_CACHE_PREFIX + userId;
        Object cachedUser = redisTemplate.opsForValue().get(cacheKey);

        if (cachedUser instanceof User) {
            log.info("User profile served from Redis cache for user: {}", userId);
            return (User) cachedUser;
        }

        return null;
    }

    public void refreshUserCache(UUID userId) {
        // Invalidate current cache
        invalidateUserCache(userId);

        // Fetch fresh data and cache it
        getCurrentUserCached(userId);
    }
}