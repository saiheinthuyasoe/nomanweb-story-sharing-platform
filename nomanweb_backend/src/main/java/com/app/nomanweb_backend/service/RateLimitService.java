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

    // Registration attempts: 3 attempts per hour per IP
    private final Bandwidth registrationBandwidth = Bandwidth.classic(3, Refill.intervally(3, Duration.ofHours(1)));

    // Password reset attempts: 3 attempts per hour per IP
    private final Bandwidth passwordResetBandwidth = Bandwidth.classic(3, Refill.intervally(3, Duration.ofHours(1)));

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
        };
    }

    public enum RateLimitType {
        LOGIN,
        REGISTRATION,
        PASSWORD_RESET
    }
}