package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.RefreshToken;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.RefreshTokenRepository;
import com.app.nomanweb_backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;

    @Value("${app.jwt.refresh-expiration}")
    private long refreshExpiration;

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Don't revoke existing tokens - let them expire naturally
        // This allows multiple concurrent sessions and prevents premature revocation

        // Generate new refresh token
        String tokenValue = jwtUtil.generateRefreshToken(user.getId());

        // Calculate expiration time
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshExpiration / 1000);

        // Create and save refresh token
        RefreshToken refreshToken = RefreshToken.builder()
                .token(tokenValue)
                .user(user)
                .expiresAt(expiresAt)
                .build();

        RefreshToken savedToken = refreshTokenRepository.save(refreshToken);

        log.info("Created refresh token for user: {} (expires: {})",
                user.getEmail(), expiresAt);

        return savedToken;
    }

    @Transactional
    public RefreshToken createRefreshTokenForLogin(User user) {
        // For login, revoke any existing refresh tokens for this user
        // This ensures only one active session per login
        revokeAllUserTokens(user, "New login", "System");

        // Generate new refresh token
        String tokenValue = jwtUtil.generateRefreshToken(user.getId());

        // Calculate expiration time
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshExpiration / 1000);

        // Create and save refresh token
        RefreshToken refreshToken = RefreshToken.builder()
                .token(tokenValue)
                .user(user)
                .expiresAt(expiresAt)
                .build();

        RefreshToken savedToken = refreshTokenRepository.save(refreshToken);

        log.info("Created refresh token for login - user: {} (expires: {})",
                user.getEmail(), expiresAt);

        return savedToken;
    }

    @Transactional
    public RefreshToken validateRefreshToken(String token) {
        // First validate the JWT structure and signature
        if (!jwtUtil.validateRefreshToken(token)) {
            log.warn("Invalid refresh token JWT structure or signature");
            return null;
        }

        // Find the token in database
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElse(null);

        if (refreshToken == null) {
            log.warn("Refresh token not found in database");
            return null;
        }

        // Check if token is valid (not revoked and not expired)
        if (!refreshToken.isValid()) {
            log.warn("Refresh token is invalid - revoked: {}, expired: {}",
                    refreshToken.isRevoked(), refreshToken.isExpired());
            return null;
        }

        return refreshToken;
    }

    @Transactional
    public RefreshToken rotateRefreshToken(String oldToken, String clientIp, String userAgent) {
        // Validate the old token
        RefreshToken oldRefreshToken = validateRefreshToken(oldToken);
        if (oldRefreshToken == null) {
            log.warn("Cannot rotate invalid refresh token");
            return null;
        }

        User user = oldRefreshToken.getUser();

        // Revoke the old token
        oldRefreshToken.revoke(clientIp, userAgent);
        refreshTokenRepository.save(oldRefreshToken);

        log.info("Revoked old refresh token for user: {} (IP: {}, UserAgent: {})",
                user.getEmail(), clientIp, userAgent);

        // Create new refresh token (without revoking other tokens)
        RefreshToken newToken = createRefreshToken(user);
        log.info("Created new refresh token for user: {} (rotation successful)", user.getEmail());
        log.info("Old token: {}...{}", oldToken.substring(0, 20), oldToken.substring(oldToken.length() - 10));
        log.info("New token: {}...{}", newToken.getToken().substring(0, 20),
                newToken.getToken().substring(newToken.getToken().length() - 10));

        return newToken;
    }

    @Transactional
    public void revokeRefreshToken(String token, String clientIp, String userAgent) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElse(null);

        if (refreshToken != null) {
            refreshToken.revoke(clientIp, userAgent);
            refreshTokenRepository.save(refreshToken);
            log.info("Revoked refresh token for user: {}", refreshToken.getUser().getEmail());
        }
    }

    @Transactional
    public void revokeAllUserTokens(User user, String clientIp, String userAgent) {
        refreshTokenRepository.revokeAllUserTokens(user, LocalDateTime.now(), clientIp, userAgent);
        log.info("Revoked all refresh tokens for user: {}", user.getEmail());
    }

    @Transactional
    public void revokeAllUserTokens(User user) {
        revokeAllUserTokens(user, "System", "System");
    }

    @Transactional
    public void cleanupExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        refreshTokenRepository.deleteExpiredTokens(now);
        log.debug("Cleaned up expired refresh tokens");
    }

    public long getActiveTokenCount(User user) {
        return refreshTokenRepository.countActiveTokensByUser(user);
    }
}