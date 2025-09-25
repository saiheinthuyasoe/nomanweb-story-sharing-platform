package com.app.nomanweb_backend.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class RateLimitService {

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    // Login attempts: 5 attempts per minute per IP
    private final Bandwidth loginBandwidth = Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1)));

    // Registration attempts: 5 attempts per hour per IP
    private final Bandwidth registrationBandwidth = Bandwidth.classic(5, Refill.intervally(5, Duration.ofHours(1)));

    // Password reset attempts: 3 attempts per hour per IP
    private final Bandwidth passwordResetBandwidth = Bandwidth.classic(3, Refill.intervally(3, Duration.ofHours(1)));

    // Email change attempts: 3 attempts per hour per IP
    private final Bandwidth emailChangeBandwidth = Bandwidth.classic(3, Refill.intervally(3, Duration.ofHours(1)));

    // Username change attempts: 3 attempts per hour per IP
    private final Bandwidth usernameChangeBandwidth = Bandwidth.classic(3, Refill.intervally(3, Duration.ofHours(1)));

    public boolean isAllowed(String key, RateLimitType type) {
        Bucket bucket = getBucket(key, type);
        boolean allowed = bucket.tryConsume(1);

        if (!allowed) {
            log.warn("Rate limit exceeded for key: {} and type: {}", key, type);
        }

        return allowed;
    }

    public long getAvailableTokens(String key, RateLimitType type) {
        Bucket bucket = getBucket(key, type);
        return bucket.getAvailableTokens();
    }

    private Bucket getBucket(String key, RateLimitType type) {
        String bucketKey = type.name() + ":" + key;
        return buckets.computeIfAbsent(bucketKey, k -> createBucket(type));
    }

    private Bucket createBucket(RateLimitType type) {
        return switch (type) {
            case LOGIN -> Bucket4j.builder().addLimit(loginBandwidth).build();
            case REGISTRATION -> Bucket4j.builder().addLimit(registrationBandwidth).build();
            case PASSWORD_RESET -> Bucket4j.builder().addLimit(passwordResetBandwidth).build();
            case EMAIL_CHANGE -> Bucket4j.builder().addLimit(emailChangeBandwidth).build();
            case USERNAME_CHANGE -> Bucket4j.builder().addLimit(usernameChangeBandwidth).build();
        };
    }

    public enum RateLimitType {
        LOGIN(5, Duration.ofMinutes(1)), // 5 attempts per minute
        REGISTRATION(5, Duration.ofHours(1)), // 5 attempts per hour
        PASSWORD_RESET(3, Duration.ofHours(1)), // 3 attempts per hour
        EMAIL_CHANGE(3, Duration.ofHours(1)), // 3 attempts per hour
        USERNAME_CHANGE(3, Duration.ofHours(1)); // 3 attempts per hour

        private final int capacity;
        private final Duration window;

        RateLimitType(int capacity, Duration window) {
            this.capacity = capacity;
            this.window = window;
        }

        public int getCapacity() {
            return capacity;
        }

        public Duration getWindow() {
            return window;
        }
    }
}