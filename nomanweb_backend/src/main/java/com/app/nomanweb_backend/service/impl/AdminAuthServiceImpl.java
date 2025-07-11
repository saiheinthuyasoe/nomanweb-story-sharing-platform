package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.admin.AdminLoginRequest;
import com.app.nomanweb_backend.dto.auth.LoginResponse;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.service.AdminAuthService;
import com.app.nomanweb_backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

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

}