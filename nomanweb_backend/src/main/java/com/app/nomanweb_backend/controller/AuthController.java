package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.auth.LoginRequest;
import com.app.nomanweb_backend.dto.auth.LoginResponse;
import com.app.nomanweb_backend.dto.auth.RegisterRequest;
import com.app.nomanweb_backend.dto.auth.EmailChangeRequest;
import com.app.nomanweb_backend.dto.auth.OAuthEmailChangeRequest;
import com.app.nomanweb_backend.dto.auth.UsernameChangeRequest;
import com.app.nomanweb_backend.dto.auth.OAuthUsernameChangeRequest;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.service.AuthService;
import com.app.nomanweb_backend.service.RateLimitService;
import com.app.nomanweb_backend.util.JwtUtil;
import com.app.nomanweb_backend.controller.UserController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001",
        "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
public class AuthController {

    private final AuthService authService;
    private final RateLimitService rateLimitService;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);

        // Check rate limit
        if (!rateLimitService.isAllowed(clientIp, RateLimitService.RateLimitType.LOGIN)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }

        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);

        // Check rate limit
        if (!rateLimitService.isAllowed(clientIp, RateLimitService.RateLimitType.REGISTRATION)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }

        try {
            LoginResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(HttpServletRequest request) {
        try {
            UUID userId = getUserIdFromRequest(request);
            User user = authService.getCurrentUser(userId);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(
            @RequestBody User updateData,
            HttpServletRequest request) {
        try {
            UUID userId = getUserIdFromRequest(request);
            User user = authService.updateProfile(userId, updateData);

            // Broadcast real-time update for profile changes
            Map<String, Object> profileData = new HashMap<>();
            profileData.put("userId", userId.toString());
            profileData.put("displayName", user.getDisplayName());
            profileData.put("bio", user.getBio());
            profileData.put("profileImageUrl", user.getProfileImageUrl());
            profileData.put("coverImageUrl", user.getCoverImageUrl());

            UserController.broadcastSocialUpdate(userId, "profile_updated", profileData);

            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<Void> changePassword(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            UUID userId = getUserIdFromRequest(httpRequest);
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");

            authService.changePassword(userId, currentPassword, newPassword);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // Check rate limit
        if (!rateLimitService.isAllowed(clientIp, RateLimitService.RateLimitType.PASSWORD_RESET)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }

        try {
            String email = request.get("email");
            authService.forgotPassword(email, clientIp, userAgent);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        try {
            String token = request.get("token");
            String password = request.get("password");
            authService.resetPassword(token, password, clientIp, userAgent);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refreshToken(@RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            String refreshToken = request.get("refreshToken");
            String clientIp = getClientIp(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            LoginResponse response = authService.refreshToken(refreshToken, clientIp, userAgent);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            String refreshToken = request.get("refreshToken");
            String clientIp = getClientIp(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            authService.logout(refreshToken, clientIp, userAgent);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            // Even if logout fails, we return success to avoid information leakage
            return ResponseEntity.ok().build();
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            authService.verifyEmail(token);
            return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerificationEmail(@RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);

        // Check rate limit (using password reset limit for verification emails)
        if (!rateLimitService.isAllowed(clientIp, RateLimitService.RateLimitType.PASSWORD_RESET)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many requests. Please try again later."));
        }

        try {
            String email = request.get("email");
            authService.resendVerificationEmail(email);
            return ResponseEntity.ok(Map.of("message", "Verification email sent"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/change-email")
    public ResponseEntity<Map<String, String>> changeEmail(@Valid @RequestBody EmailChangeRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // Check rate limit
        if (!rateLimitService.isAllowed(clientIp, RateLimitService.RateLimitType.EMAIL_CHANGE)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many email change requests. Please try again later."));
        }

        try {
            UUID userId = getUserIdFromRequest(httpRequest);
            authService.changeEmail(userId, request.getCurrentPassword(), request.getNewEmail(), clientIp, userAgent);
            return ResponseEntity.ok(Map.of("message", "Email change verification sent to new email address"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/change-email-oauth")
    public ResponseEntity<Map<String, String>> changeEmailOAuth(@Valid @RequestBody OAuthEmailChangeRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // Check rate limit
        if (!rateLimitService.isAllowed(clientIp, RateLimitService.RateLimitType.EMAIL_CHANGE)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many email change requests. Please try again later."));
        }

        try {
            UUID userId = getUserIdFromRequest(httpRequest);
            authService.changeEmailOAuth(userId, request.getNewEmail(), clientIp, userAgent);
            return ResponseEntity.ok(Map.of("message", "Email change verification sent to new email address"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-email-change")
    public ResponseEntity<Map<String, String>> verifyEmailChange(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            authService.verifyEmailChange(token);
            return ResponseEntity.ok(Map.of("message", "Email changed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/resend-email-change-verification")
    public ResponseEntity<Map<String, String>> resendEmailChangeVerification(@RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);

        // Check rate limit
        if (!rateLimitService.isAllowed(clientIp, RateLimitService.RateLimitType.EMAIL_CHANGE)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many requests. Please try again later."));
        }

        try {
            UUID userId = getUserIdFromRequest(httpRequest);
            String newEmail = request.get("newEmail");
            authService.resendEmailChangeVerification(userId, newEmail);
            return ResponseEntity.ok(Map.of("message", "Email change verification resent"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/change-username")
    public ResponseEntity<Map<String, String>> changeUsername(@Valid @RequestBody UsernameChangeRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // Check rate limit
        if (!rateLimitService.isAllowed(clientIp, RateLimitService.RateLimitType.USERNAME_CHANGE)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many username change requests. Please try again later."));
        }

        try {
            UUID userId = getUserIdFromRequest(httpRequest);
            authService.changeUsername(userId, request.getCurrentPassword(), request.getNewUsername(), clientIp,
                    userAgent);
            return ResponseEntity.ok(Map.of("message", "Username changed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/change-username-oauth")
    public ResponseEntity<Map<String, String>> changeUsernameOAuth(
            @Valid @RequestBody OAuthUsernameChangeRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // Check rate limit
        if (!rateLimitService.isAllowed(clientIp, RateLimitService.RateLimitType.USERNAME_CHANGE)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many username change requests. Please try again later."));
        }

        try {
            UUID userId = getUserIdFromRequest(httpRequest);
            authService.changeUsernameOAuth(userId, request.getNewUsername(), clientIp, userAgent);
            return ResponseEntity.ok(Map.of("message", "Username changed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/debug-user")
    public ResponseEntity<Map<String, Object>> debugUser(HttpServletRequest request) {
        try {
            UUID userId = getUserIdFromRequest(request);
            User user = authService.getCurrentUser(userId);

            Map<String, Object> debugInfo = new HashMap<>();
            debugInfo.put("userId", user.getId().toString());
            debugInfo.put("email", user.getEmail());
            debugInfo.put("username", user.getUsername());
            debugInfo.put("role", user.getRole().toString());
            debugInfo.put("status", user.getStatus().toString());
            debugInfo.put("isActive", user.isActive());
            debugInfo.put("emailVerified", user.getEmailVerified());
            debugInfo.put("googleId", user.getGoogleId());
            debugInfo.put("lineUserId", user.getLineUserId());
            debugInfo.put("lastLoginAt", user.getLastLoginAt());
            debugInfo.put("createdAt", user.getCreatedAt());

            return ResponseEntity.ok(debugInfo);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    private UUID getUserIdFromRequest(HttpServletRequest request) {
        // Get the authenticated user from SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !authentication.getPrincipal().equals("anonymousUser")) {
            return UUID.fromString(authentication.getName());
        }
        throw new RuntimeException("No valid authentication found");
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}