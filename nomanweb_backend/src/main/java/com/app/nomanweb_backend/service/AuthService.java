package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.auth.LoginRequest;
import com.app.nomanweb_backend.dto.auth.LoginResponse;
import com.app.nomanweb_backend.dto.auth.RegisterRequest;
import com.app.nomanweb_backend.entity.EmailVerificationToken;
import com.app.nomanweb_backend.entity.PasswordResetAttempt;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.EmailVerificationTokenRepository;
import com.app.nomanweb_backend.repository.PasswordResetAttemptRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetAttemptRepository passwordResetAttemptRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.email.verification.expiry:48}")
    private int emailVerificationExpiryHours;

    @Value("${security.rate-limit.password-reset.attempts:5}")
    private int maxPasswordResetAttemptsPerHour;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrUsername(request.getEmail(), request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!user.isActive()) {
            throw new RuntimeException("Account is not active");
        }

        // Check if email is verified
        if (!user.getEmailVerified()) {
            throw new RuntimeException(
                    "Please verify your email address before logging in. Check your inbox for the verification link.");
        }

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // Generate tokens
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        log.info("User {} logged in successfully", user.getEmail());

        return LoginResponse.builder()
                .user(user)
                .token(token)
                .refreshToken(refreshToken)
                .build();
    }

    public LoginResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        // Create new user
        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .displayName(request.getDisplayName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .status(User.Status.ACTIVE)
                .emailVerified(false)
                .build();

        user = userRepository.save(user);

        // Generate and send email verification token
        String verificationToken = generateEmailVerificationToken(user);
        emailService.sendVerificationEmail(user, verificationToken);

        log.info("User {} registered successfully. Verification email sent.", user.getEmail());

        // Note: We don't return JWT tokens here since email is not verified
        return LoginResponse.builder()
                .user(user)
                .token(null) // No token until email is verified
                .refreshToken(null)
                .build();
    }

    public void verifyEmail(String token) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification token"));

        if (!verificationToken.isValid()) {
            throw new RuntimeException("Verification token has expired or already been used");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        // Mark token as used
        verificationToken.setUsed(true);
        verificationToken.setUsedAt(LocalDateTime.now());
        emailVerificationTokenRepository.save(verificationToken);

        // Send welcome email
        emailService.sendWelcomeEmail(user);

        log.info("Email verified successfully for user: {}", user.getEmail());
    }

    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmailVerified()) {
            throw new RuntimeException("Email is already verified");
        }

        // Delete any existing unused tokens
        emailVerificationTokenRepository.deleteAllByUser(user);

        // Generate new verification token
        String verificationToken = generateEmailVerificationToken(user);
        emailService.sendVerificationEmail(user, verificationToken);

        log.info("Verification email resent to: {}", user.getEmail());
    }

    private String generateEmailVerificationToken(User user) {
        String token = UUID.randomUUID().toString();

        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(emailVerificationExpiryHours))
                .build();

        emailVerificationTokenRepository.save(verificationToken);
        return token;
    }

    public User getCurrentUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateProfile(UUID userId, User updateData) {
        User user = getCurrentUser(userId);

        if (updateData.getDisplayName() != null) {
            user.setDisplayName(updateData.getDisplayName());
        }
        if (updateData.getBio() != null) {
            user.setBio(updateData.getBio());
        }
        if (updateData.getProfileImageUrl() != null) {
            user.setProfileImageUrl(updateData.getProfileImageUrl());
        }

        return userRepository.save(user);
    }

    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        User user = getCurrentUser(userId);

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setLastPasswordChange(LocalDateTime.now());
        userRepository.save(user);

        // Send notification email
        emailService.sendPasswordChangeNotification(user);

        log.info("Password changed successfully for user: {}", user.getEmail());
    }

    public void forgotPassword(String email, String ipAddress, String userAgent) {
        // Log the password reset attempt
        PasswordResetAttempt attempt = PasswordResetAttempt.builder()
                .email(email)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .tokenGenerated(false)
                .success(false)
                .build();

        try {
            // Check if user exists
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check for too many recent attempts from this email
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            long recentAttempts = passwordResetAttemptRepository.countByEmailAndCreatedAtAfter(email, oneHourAgo);

            if (recentAttempts >= maxPasswordResetAttemptsPerHour) {
                log.warn("Too many password reset attempts for email: {} from IP: {}", email, ipAddress);
                attempt.setTokenGenerated(false);
                passwordResetAttemptRepository.save(attempt);
                throw new RuntimeException("Too many password reset attempts. Please try again later.");
            }

            // Check for too many recent attempts from this IP
            long recentIpAttempts = passwordResetAttemptRepository.countByIpAddressAndCreatedAtAfter(ipAddress,
                    oneHourAgo);

            if (recentIpAttempts >= maxPasswordResetAttemptsPerHour * 2) { // Allow more attempts per IP for shared
                                                                           // networks
                log.warn("Too many password reset attempts from IP: {}", ipAddress);
                attempt.setTokenGenerated(false);
                passwordResetAttemptRepository.save(attempt);
                throw new RuntimeException(
                        "Too many password reset attempts from this location. Please try again later.");
            }

            // Generate reset token
            String resetToken = UUID.randomUUID().toString();
            user.setPasswordResetToken(resetToken);
            user.setPasswordResetExpires(LocalDateTime.now().plusHours(24));
            userRepository.save(user);

            // Send password reset email
            emailService.sendPasswordResetEmail(user, resetToken);

            // Mark attempt as successful with token generated
            attempt.setTokenGenerated(true);
            passwordResetAttemptRepository.save(attempt);

            log.info("Password reset email sent to: {} from IP: {}", user.getEmail(), ipAddress);

        } catch (RuntimeException e) {
            // Save failed attempt
            attempt.setTokenGenerated(false);
            passwordResetAttemptRepository.save(attempt);

            // For security, we don't reveal if the email exists or not
            // Always return success to prevent email enumeration
            log.warn("Password reset attempt failed for email: {} from IP: {} - {}", email, ipAddress, e.getMessage());

            // Re-throw only for rate limiting, not for user not found
            if (e.getMessage().contains("Too many")) {
                throw e;
            }
        }
    }

    public void resetPassword(String token, String newPassword, String ipAddress, String userAgent) {
        // Find the original attempt that generated this token
        PasswordResetAttempt attempt = null;

        try {
            User user = userRepository.findByPasswordResetToken(token)
                    .orElseThrow(() -> new RuntimeException("Invalid reset token"));

            if (user.getPasswordResetExpires().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Reset token has expired");
            }

            // Find the most recent attempt for this email that generated a token
            attempt = passwordResetAttemptRepository.findByEmailOrderByCreatedAtDesc(user.getEmail())
                    .stream()
                    .filter(a -> a.getTokenGenerated() && !a.getSuccess())
                    .findFirst()
                    .orElse(null);

            // Update password
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            user.setPasswordResetToken(null);
            user.setPasswordResetExpires(null);
            user.setLastPasswordChange(LocalDateTime.now());
            userRepository.save(user);

            // Mark the attempt as successful
            if (attempt != null) {
                attempt.setSuccess(true);
                passwordResetAttemptRepository.save(attempt);
            }

            // Send notification email
            emailService.sendPasswordChangeNotification(user);

            log.info("Password reset successfully for user: {} from IP: {}", user.getEmail(), ipAddress);

        } catch (RuntimeException e) {
            // If we found an attempt, we can mark it as failed
            if (attempt != null) {
                attempt.setSuccess(false);
                passwordResetAttemptRepository.save(attempt);
            }

            log.warn("Password reset failed for token from IP: {} - {}", ipAddress, e.getMessage());
            throw e;
        }
    }

    // Overloaded methods for backward compatibility
    public void forgotPassword(String email) {
        forgotPassword(email, "unknown", "unknown");
    }

    public void resetPassword(String token, String newPassword) {
        resetPassword(token, newPassword, "unknown", "unknown");
    }

    public LoginResponse refreshToken(String refreshToken) {
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        UUID userId = jwtUtil.getUserIdFromToken(refreshToken);
        User user = getCurrentUser(userId);

        String newToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getId());

        return LoginResponse.builder()
                .user(user)
                .token(newToken)
                .refreshToken(newRefreshToken)
                .build();
    }
}