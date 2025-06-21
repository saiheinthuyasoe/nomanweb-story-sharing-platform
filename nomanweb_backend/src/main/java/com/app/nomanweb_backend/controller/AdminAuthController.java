package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.admin.*;
import com.app.nomanweb_backend.dto.auth.LoginResponse;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.service.AdminAuthService;
import com.app.nomanweb_backend.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @PostMapping("/register")
    @Operation(summary = "Register admin using invitation token")
    public ResponseEntity<?> adminRegister(@Valid @RequestBody AdminRegisterRequest request) {
        try {
            LoginResponse response = adminAuthService.adminRegister(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/invitation/validate/{token}")
    @Operation(summary = "Validate admin invitation token")
    public ResponseEntity<?> validateInvitation(@PathVariable String token) {
        try {
            AdminInvitationResponse response = adminAuthService.validateInvitation(token);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Super Admin Only Endpoints (Require ADMIN role)

    @PostMapping("/invitation/create")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Create admin invitation (Admin only)")
    public ResponseEntity<?> createInvitation(
            @Valid @RequestBody AdminInvitationRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            UUID currentAdminId = extractAdminIdFromToken(token);
            AdminInvitationResponse response = adminAuthService.createInvitation(request, currentAdminId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/invitations")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Get all admin invitations (Admin only)")
    public ResponseEntity<List<AdminInvitationResponse>> getAllInvitations() {
        List<AdminInvitationResponse> invitations = adminAuthService.getAllInvitations();
        return ResponseEntity.ok(invitations);
    }

    @GetMapping("/invitations/paged")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Get paginated admin invitations (Admin only)")
    public ResponseEntity<Page<AdminInvitationResponse>> getInvitations(Pageable pageable) {
        Page<AdminInvitationResponse> invitations = adminAuthService.getInvitations(pageable);
        return ResponseEntity.ok(invitations);
    }

    @DeleteMapping("/invitation/{invitationId}/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Revoke admin invitation (Admin only)")
    public ResponseEntity<?> revokeInvitation(
            @PathVariable UUID invitationId,
            @RequestHeader("Authorization") String token) {
        try {
            UUID currentAdminId = extractAdminIdFromToken(token);
            AdminInvitationResponse response = adminAuthService.revokeInvitation(invitationId, currentAdminId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
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

    @PostMapping("/maintenance/cleanup-invitations")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Cleanup expired invitations (Admin only)")
    public ResponseEntity<?> cleanupExpiredInvitations() {
        int cleanedUp = adminAuthService.cleanupExpiredInvitations();
        return ResponseEntity.ok(Map.of(
                "message", "Cleanup completed",
                "expiredInvitations", cleanedUp));
    }

    @GetMapping("/verify-admin")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Verify admin access (Admin only)")
    public ResponseEntity<?> verifyAdminAccess(@RequestHeader("Authorization") String token) {
        try {
            UUID adminId = extractAdminIdFromToken(token);
            adminAuthService.validateAdminPermissions(adminId, "VERIFY_ACCESS");
            return ResponseEntity.ok(Map.of(
                    "message", "Admin access verified",
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