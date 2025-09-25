package com.app.nomanweb_backend.config;

import com.app.nomanweb_backend.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final RefreshTokenService refreshTokenService;

    /**
     * Clean up expired refresh tokens every hour
     * This prevents database bloat from expired tokens
     */
    @Scheduled(fixedRate = 3600000) // 1 hour in milliseconds
    public void cleanupExpiredTokens() {
        try {
            log.debug("Starting cleanup of expired refresh tokens");
            refreshTokenService.cleanupExpiredTokens();
            log.debug("Completed cleanup of expired refresh tokens");
        } catch (Exception e) {
            log.error("Error during token cleanup: {}", e.getMessage(), e);
        }
    }
}