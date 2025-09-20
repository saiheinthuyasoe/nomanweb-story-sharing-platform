package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.admin.AdminLoginRequest;
import com.app.nomanweb_backend.dto.auth.LoginResponse;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.service.AdminAuthService;
import com.app.nomanweb_backend.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin Authentication", description = "Secure admin authentication and invitation management")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @PostMapping("/login")
    @Operation(summary = "Admin login with enhanced security")
    public ResponseEntity<LoginResponse> adminLogin(
            @Valid @RequestBody AdminLoginRequest request,
            HttpServletRequest httpRequest) {

        // Add IP and User-Agent tracking for security
        request.setIpAddress(getClientIpAddress(httpRequest));
        request.setUserAgent(httpRequest.getHeader("User-Agent"));

        LoginResponse response = adminAuthService.adminLogin(request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh admin access token using refresh token")
    public ResponseEntity<LoginResponse> refreshAdminToken(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            String refreshToken = request.get("refreshToken");
            String clientIp = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            LoginResponse response = adminAuthService.refreshAdminToken(refreshToken, clientIp, userAgent);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Admin token refresh failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/logout")
    @Operation(summary = "Admin logout with refresh token revocation")
    public ResponseEntity<Void> adminLogout(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            String refreshToken = request.get("refreshToken");
            String clientIp = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            adminAuthService.adminLogout(refreshToken, clientIp, userAgent);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            // Even if logout fails, we return success to avoid information leakage
            log.warn("Admin logout error: {}", e.getMessage());
            return ResponseEntity.ok().build();
        }
    }

    @PostMapping("/users/{userId}/promote")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Promote user to admin (Admin only)")
    public ResponseEntity<?> promoteToAdmin(
            @PathVariable UUID userId,
            @RequestHeader("Authorization") String token) {
        try {
            UUID currentAdminId = extractAdminIdFromToken(token);
            adminAuthService.promoteToAdmin(userId, currentAdminId);
            return ResponseEntity.ok(Map.of("message", "User promoted to admin successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/users/{userId}/demote")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Demote admin to user (Admin only)")
    public ResponseEntity<?> demoteFromAdmin(
            @PathVariable UUID userId,
            @RequestHeader("Authorization") String token) {
        try {
            UUID currentAdminId = extractAdminIdFromToken(token);
            adminAuthService.demoteFromAdmin(userId, currentAdminId);
            return ResponseEntity.ok(Map.of("message", "Admin demoted to user successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/admins")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Get all admin users (Admin only)")
    public ResponseEntity<List<User>> getAllAdmins() {
        List<User> admins = adminAuthService.getAllAdmins();
        return ResponseEntity.ok(admins);
    }

    @GetMapping("/verify-admin")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Verify admin access (Admin only)")
    public ResponseEntity<?> verifyAdminAccess(@RequestHeader("Authorization") String token) {
        try {
            UUID adminId = extractAdminIdFromToken(token);
            adminAuthService.validateAdminPermissions(adminId, "VERIFY_ACCESS");

            // Get the admin user details to return complete user information
            User adminUser = userRepository.findById(adminId)
                    .orElseThrow(() -> new RuntimeException("Admin user not found"));

            return ResponseEntity.ok(Map.of(
                    "message", "Admin access verified",
                    "user", adminUser,
                    "adminId", adminId,
                    "timestamp", System.currentTimeMillis()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Utility Methods

    private UUID extractAdminIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid authorization header");
        }

        String token = authHeader.substring(7);
        return jwtUtil.getUserIdFromToken(token);
    }

    private String getClientIpAddress(HttpServletRequest request) {
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