package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.admin.*;
import com.app.nomanweb_backend.dto.auth.LoginResponse;
import com.app.nomanweb_backend.entity.AdminInvitation;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.AdminInvitationRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.service.AdminAuthService;
import com.app.nomanweb_backend.service.EmailService;
import com.app.nomanweb_backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminAuthServiceImpl implements AdminAuthService {

    private final UserRepository userRepository;
    private final AdminInvitationRepository adminInvitationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Override
    public LoginResponse adminLogin(AdminLoginRequest request) {
        log.info("Admin login attempt for email: {}", request.getEmail());

        // Verify user exists and is admin
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid admin credentials"));

        if (!user.getRole().equals(User.Role.ADMIN)) {
            log.warn("Non-admin user attempted admin login: {}", request.getEmail());
            throw new RuntimeException("Access denied. Admin privileges required.");
        }

        // Verify password manually (avoid AuthenticationManager circular dependency)
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Failed admin authentication for: {}", request.getEmail());
            throw new RuntimeException("Invalid admin credentials");
        }

        // Generate JWT token
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        logAdminActivity("ADMIN_LOGIN", user.getId(),
                String.format("IP: %s, User-Agent: %s", request.getIpAddress(), request.getUserAgent()));

        log.info("Successful admin login for: {}", request.getEmail());

        return LoginResponse.builder()
                .token(token)
                .user(user)
                .build();
    }

    @Override
    public LoginResponse adminRegister(AdminRegisterRequest request) {
        log.info("Admin registration attempt with token: {}", request.getInvitationToken());

        // Validate invitation
        AdminInvitation invitation = adminInvitationRepository.findByInvitationToken(request.getInvitationToken())
                .orElseThrow(() -> new RuntimeException("Invalid or expired invitation token"));

        if (!invitation.isValid()) {
            throw new RuntimeException("Invitation has expired or already been used");
        }

        if (!invitation.getEmail().equals(request.getEmail())) {
            throw new RuntimeException("Email does not match invitation");
        }

        // Validate password confirmation
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User with this email already exists");
        }

        // Create admin user
        User adminUser = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .username(generateUsernameFromName(request.getFirstName(), request.getLastName()))
                .displayName(request.getFirstName() + " " + request.getLastName())
                .role(User.Role.ADMIN)
                .emailVerified(true) // Admins are pre-verified
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        adminUser = userRepository.save(adminUser);

        // Mark invitation as used
        invitation.markAsUsed(adminUser);
        adminInvitationRepository.save(invitation);

        // Generate JWT token
        String token = jwtUtil.generateToken(adminUser.getId(), adminUser.getEmail(), adminUser.getRole().name());

        logAdminActivity("ADMIN_REGISTRATION", adminUser.getId(),
                String.format("Registered via invitation from: %s", invitation.getInvitedBy().getEmail()));

        log.info("Successful admin registration for: {}", request.getEmail());

        return LoginResponse.builder()
                .token(token)
                .user(adminUser)
                .build();
    }

    @Override
    public AdminInvitationResponse createInvitation(AdminInvitationRequest request, UUID currentAdminId) {
        log.info("Creating admin invitation for: {}", request.getEmail());

        // Check if invitation already exists for this email
        if (adminInvitationRepository.existsByEmailAndStatus(request.getEmail(), AdminInvitation.Status.PENDING)) {
            throw new RuntimeException("Pending invitation already exists for this email");
        }

        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User with this email already exists");
        }

        User inviter = userRepository.findById(currentAdminId)
                .orElseThrow(() -> new RuntimeException("Invalid admin"));

        // Create invitation
        int expirationHours = request.getExpirationHours() != null ? request.getExpirationHours() : 24;

        AdminInvitation invitation = AdminInvitation.builder()
                .email(request.getEmail())
                .invitationToken(generateInvitationToken())
                .invitedBy(inviter)
                .status(AdminInvitation.Status.PENDING)
                .expiresAt(LocalDateTime.now().plusHours(expirationHours))
                .notes(request.getNotes())
                .build();

        invitation = adminInvitationRepository.save(invitation);

        // Send invitation email
        sendInvitationEmail(invitation);

        logAdminActivity("ADMIN_INVITATION_CREATED", currentAdminId,
                String.format("Invited: %s", request.getEmail()));

        log.info("Admin invitation created for: {}", request.getEmail());

        return mapToResponse(invitation);
    }

    @Override
    public AdminInvitationResponse validateInvitation(String invitationToken) {
        AdminInvitation invitation = adminInvitationRepository.findByInvitationToken(invitationToken)
                .orElseThrow(() -> new RuntimeException("Invalid invitation token"));

        return mapToResponse(invitation);
    }

    @Override
    public List<AdminInvitationResponse> getAllInvitations() {
        return adminInvitationRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<AdminInvitationResponse> getInvitations(Pageable pageable) {
        return adminInvitationRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToResponse);
    }

    @Override
    public AdminInvitationResponse revokeInvitation(UUID invitationId, UUID currentAdminId) {
        AdminInvitation invitation = adminInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        invitation.revoke();
        invitation = adminInvitationRepository.save(invitation);

        logAdminActivity("ADMIN_INVITATION_REVOKED", currentAdminId,
                String.format("Revoked invitation for: %s", invitation.getEmail()));

        return mapToResponse(invitation);
    }

    @Override
    public void promoteToAdmin(UUID userId, UUID currentAdminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.Role.ADMIN) {
            throw new RuntimeException("User is already an admin");
        }

        user.setRole(User.Role.ADMIN);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        logAdminActivity("USER_PROMOTED_TO_ADMIN", currentAdminId,
                String.format("Promoted user: %s", user.getEmail()));

        log.info("User {} promoted to admin by {}", user.getEmail(), currentAdminId);
    }

    @Override
    public void demoteFromAdmin(UUID userId, UUID currentAdminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("User is not an admin");
        }

        // Prevent self-demotion
        if (user.getId().equals(currentAdminId)) {
            throw new RuntimeException("Cannot demote yourself");
        }

        user.setRole(User.Role.USER);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        logAdminActivity("ADMIN_DEMOTED_TO_USER", currentAdminId,
                String.format("Demoted admin: %s", user.getEmail()));

        log.info("Admin {} demoted to user by {}", user.getEmail(), currentAdminId);
    }

    @Override
    public List<User> getAllAdmins() {
        return userRepository.findAll()
                .stream()
                .filter(user -> user.getRole() == User.Role.ADMIN)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isValidAdminUser(String email) {
        return userRepository.findByEmail(email)
                .map(user -> user.getRole() == User.Role.ADMIN)
                .orElse(false);
    }

    @Override
    public void logAdminActivity(String activity, UUID adminId, String details) {
        log.info("ADMIN_ACTIVITY - Admin: {}, Action: {}, Details: {}", adminId, activity, details);
        // TODO: Implement admin activity logging to database
    }

    @Override
    public void validateAdminPermissions(UUID adminId, String action) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Insufficient privileges");
        }

        // TODO: Implement fine-grained permission checks based on action
    }

    @Override
    public int cleanupExpiredInvitations() {
        return adminInvitationRepository.markExpiredInvitations(LocalDateTime.now());
    }

    // Helper methods

    private String generateInvitationToken() {
        return UUID.randomUUID().toString().replace("-", "") +
                System.currentTimeMillis();
    }

    private String generateUsernameFromName(String firstName, String lastName) {
        String baseUsername = (firstName + lastName).toLowerCase().replaceAll("[^a-z0-9]", "");
        String username = baseUsername;
        int counter = 1;

        while (userRepository.existsByUsername(username)) {
            username = baseUsername + counter++;
        }

        return username;
    }

    private void sendInvitationEmail(AdminInvitation invitation) {
        try {
            log.info("Sending admin invitation email to: {}", invitation.getEmail());
            // TODO: Implement custom email sending or extend EmailService
            // For now, we'll log the invitation details
            log.info("Admin invitation token: {} expires at: {}",
                    invitation.getInvitationToken(), invitation.getExpiresAt());
        } catch (Exception e) {
            log.error("Failed to send invitation email to: {}", invitation.getEmail(), e);
        }
    }

    private AdminInvitationResponse mapToResponse(AdminInvitation invitation) {
        long hoursUntilExpiration = invitation.getExpiresAt().isAfter(LocalDateTime.now())
                ? Duration.between(LocalDateTime.now(), invitation.getExpiresAt()).toHours()
                : 0;

        return AdminInvitationResponse.builder()
                .id(invitation.getId())
                .email(invitation.getEmail())
                .status(invitation.getStatus())
                .expiresAt(invitation.getExpiresAt())
                .createdAt(invitation.getCreatedAt())
                .usedAt(invitation.getUsedAt())
                .notes(invitation.getNotes())
                .invitedByName(invitation.getInvitedBy().getDisplayNameOrUsername())
                .invitedByEmail(invitation.getInvitedBy().getEmail())
                .registeredAdminName(invitation.getRegisteredAdmin() != null
                        ? invitation.getRegisteredAdmin().getDisplayNameOrUsername()
                        : null)
                .registeredAdminEmail(invitation.getRegisteredAdmin() != null
                        ? invitation.getRegisteredAdmin().getEmail()
                        : null)
                .isExpired(invitation.isExpired())
                .isValid(invitation.isValid())
                .hoursUntilExpiration(hoursUntilExpiration)
                .build();
    }
}