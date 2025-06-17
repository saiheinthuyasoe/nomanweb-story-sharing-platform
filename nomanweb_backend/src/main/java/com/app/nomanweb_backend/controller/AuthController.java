package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.auth.LoginRequest;
import com.app.nomanweb_backend.dto.auth.LoginResponse;
import com.app.nomanweb_backend.dto.auth.RegisterRequest;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.service.AuthService;
import com.app.nomanweb_backend.service.RateLimitService;
import com.app.nomanweb_backend.util.JwtUtil;
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

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
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
    public ResponseEntity<LoginResponse> refreshToken(@RequestBody Map<String, String> request) {
        try {
            String refreshToken = request.get("refreshToken");
            LoginResponse response = authService.refreshToken(refreshToken);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
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