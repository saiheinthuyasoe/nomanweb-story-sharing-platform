package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.RefreshToken;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.RefreshTokenRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class TestController {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @GetMapping("/auth")
    public ResponseEntity<Map<String, Object>> testAuth() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getPrincipal().equals("anonymousUser")) {

            return ResponseEntity.ok(Map.of(
                    "message", "Authentication successful",
                    "userId", authentication.getName(),
                    "authorities", authentication.getAuthorities(),
                    "timestamp", LocalDateTime.now()));
        } else {
            return ResponseEntity.status(401).body(Map.of(
                    "message", "Not authenticated",
                    "timestamp", LocalDateTime.now()));
        }
    }

    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> testPublic() {
        return ResponseEntity.ok(Map.of(
                "message", "This is a public endpoint",
                "timestamp", LocalDateTime.now()));
    }

    @GetMapping("/tokens")
    public ResponseEntity<Map<String, Object>> checkTokens() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() ||
                authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        try {
            UUID userId = UUID.fromString(authentication.getName());
            User user = userRepository.findById(userId).orElse(null);

            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            List<RefreshToken> tokens = refreshTokenRepository.findByUser(user);
            List<Map<String, Object>> tokenInfo = tokens.stream()
                    .map(token -> Map.<String, Object>of(
                            "id", token.getId(),
                            "token",
                            token.getToken().substring(0, 20) + "..."
                                    + token.getToken().substring(token.getToken().length() - 10),
                            "expiresAt", token.getExpiresAt(),
                            "revoked", token.isRevoked(),
                            "revokedAt", token.getRevokedAt(),
                            "isValid", token.isValid()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "userEmail", user.getEmail(),
                    "activeTokenCount", refreshTokenRepository.countActiveTokensByUser(user),
                    "totalTokenCount", tokens.size(),
                    "tokens", tokenInfo,
                    "timestamp", LocalDateTime.now()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}