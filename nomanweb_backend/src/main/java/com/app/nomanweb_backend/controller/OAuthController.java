package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.auth.LoginResponse;
import com.app.nomanweb_backend.service.OAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/oauth")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
@Slf4j
public class OAuthController {

    private final OAuthService oAuthService;

    @PostMapping("/google")
    public ResponseEntity<LoginResponse> googleLogin(@RequestBody Map<String, String> request) {
        try {
            String idToken = request.get("idToken");
            if (idToken == null || idToken.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            LoginResponse response = oAuthService.authenticateWithGoogle(idToken);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Google OAuth failed", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/line")
    public ResponseEntity<LoginResponse> lineLogin(@RequestBody Map<String, String> request) {
        try {
            log.info("LINE OAuth request received");
            log.debug("Request body: {}", request);

            String accessToken = request.get("accessToken");
            log.info("Access token received: {}",
                    accessToken != null ? "Yes (length: " + accessToken.length() + ")" : "No");

            if (accessToken == null || accessToken.trim().isEmpty()) {
                log.warn("Access token is null or empty");
                return ResponseEntity.badRequest().build();
            }

            log.info("Calling LINE OAuth service...");
            LoginResponse response = oAuthService.authenticateWithLine(accessToken);
            log.info("LINE OAuth successful for user: {}", response.getUser().getUsername());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("LINE OAuth failed", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/link-google")
    public ResponseEntity<Map<String, String>> linkGoogleAccount(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String idToken = request.get("idToken");
            String userId = extractUserIdFromAuthHeader(authHeader);

            oAuthService.linkGoogleAccount(userId, idToken);
            return ResponseEntity.ok(Map.of("message", "Google account linked successfully"));
        } catch (Exception e) {
            log.error("Failed to link Google account", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/link-line")
    public ResponseEntity<Map<String, String>> linkLineAccount(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String accessToken = request.get("accessToken");
            String userId = extractUserIdFromAuthHeader(authHeader);

            oAuthService.linkLineAccount(userId, accessToken);
            return ResponseEntity.ok(Map.of("message", "LINE account linked successfully"));
        } catch (Exception e) {
            log.error("Failed to link LINE account", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    private String extractUserIdFromAuthHeader(String authHeader) {
        // This would use JwtUtil to extract user ID from token
        // For now, returning a placeholder
        return "user-id-from-token";
    }
}