package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.auth.LoginRequest;
import com.app.nomanweb_backend.dto.auth.LoginResponse;
import com.app.nomanweb_backend.dto.auth.RegisterRequest;
import com.app.nomanweb_backend.entity.EmailVerificationToken;
import com.app.nomanweb_backend.entity.EmailChangeToken;
import com.app.nomanweb_backend.entity.RefreshToken;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.EmailVerificationTokenRepository;
import com.app.nomanweb_backend.repository.EmailChangeTokenRepository;
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
    private final EmailChangeTokenRepository emailChangeTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final RefreshTokenService refreshTokenService;

    @Value("${app.email.verification.expiry:48}")
    private int emailVerificationExpiryHours;

    @Value("${app.email.change.expiry:24}")
    private int emailChangeExpiryHours;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrUsername(request.getEmail(), request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!user.isActive()) {
            throw new RuntimeException("Account is not active");
        }

        // Check if email is verified (skip for OAuth users)
        if (!user.getEmailVerified() && !user.canUseOAuthEndpoints()) {
            throw new RuntimeException(
                    "Please verify your email address before logging in. Check your inbox for the verification link.");
        }

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // Generate tokens
        String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshTokenForLogin(user);

        log.info("User {} logged in successfully", user.getEmail());

        return LoginResponse.builder()
                .user(user)
                .token(accessToken)
                .refreshToken(refreshToken.getToken())
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
        if (updateData.getCoverImageUrl() != null) {
            user.setCoverImageUrl(updateData.getCoverImageUrl());
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
        try {
            // Check if user exists
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Generate reset token
            String resetToken = UUID.randomUUID().toString();
            user.setPasswordResetToken(resetToken);
            user.setPasswordResetExpires(LocalDateTime.now().plusHours(24));
            userRepository.save(user);

            // Send password reset email
            emailService.sendPasswordResetEmail(user, resetToken);

            log.info("Password reset email sent to: {} from IP: {}", user.getEmail(), ipAddress);

        } catch (RuntimeException e) {
            // For security, we don't reveal if the email exists or not
            // Always return success to prevent email enumeration
            log.warn("Password reset attempt failed for email: {} from IP: {} - {}", email, ipAddress, e.getMessage());

            // Re-throw the exception
            throw e;
        }
    }

    public void resetPassword(String token, String newPassword, String ipAddress, String userAgent) {
        try {
            User user = userRepository.findByPasswordResetToken(token)
                    .orElseThrow(() -> new RuntimeException("Invalid reset token"));

            if (user.getPasswordResetExpires().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Reset token has expired");
            }

            // Update password
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            user.setPasswordResetToken(null);
            user.setPasswordResetExpires(null);
            user.setLastPasswordChange(LocalDateTime.now());
            userRepository.save(user);

            // Send notification email
            emailService.sendPasswordChangeNotification(user);

            log.info("Password reset successfully for user: {} from IP: {}", user.getEmail(), ipAddress);

        } catch (RuntimeException e) {
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

    public LoginResponse refreshToken(String refreshTokenValue, String clientIp, String userAgent) {
        // Validate and rotate refresh token
        RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(refreshTokenValue, clientIp, userAgent);

        if (newRefreshToken == null) {
            throw new RuntimeException("Invalid or expired refresh token");
        }

        User user = newRefreshToken.getUser();

        // Generate new access token
        String newAccessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        log.info("Tokens refreshed successfully for user: {}", user.getEmail());

        return LoginResponse.builder()
                .user(user)
                .token(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .build();
    }

    // Overloaded method for backward compatibility
    public LoginResponse refreshToken(String refreshToken) {
        return refreshToken(refreshToken, "unknown", "unknown");
    }

    public void logout(String refreshTokenValue, String clientIp, String userAgent) {
        try {
            refreshTokenService.revokeRefreshToken(refreshTokenValue, clientIp, userAgent);
            log.info("User logged out successfully");
        } catch (Exception e) {
            log.warn("Error during logout: {}", e.getMessage());
        }
    }

    public void logout(String refreshToken) {
        logout(refreshToken, "unknown", "unknown");
    }

    public void changeEmail(UUID userId, String currentPassword, String newEmail, String ipAddress, String userAgent) {
        User user = getCurrentUser(userId);

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Check if new email is different from current email
        if (newEmail.equalsIgnoreCase(user.getEmail())) {
            throw new RuntimeException("New email must be different from current email");
        }

        // Check if new email is already in use
        if (userRepository.existsByEmail(newEmail)) {
            throw new RuntimeException("Email address is already in use");
        }

        // Delete any existing unused email change tokens for this user
        emailChangeTokenRepository.deleteAllByUser(user);

        // Generate email change token
        String changeToken = generateEmailChangeToken(user, newEmail);

        // Send verification email to new email address
        emailService.sendEmailChangeVerificationEmail(user, newEmail, changeToken);

        log.info("Email change verification sent to: {} for user: {} from IP: {}", newEmail, user.getEmail(),
                ipAddress);
    }

    public void changeEmailOAuth(UUID userId, String newEmail, String ipAddress, String userAgent) {
        User user = getCurrentUser(userId);

        // Check if user is OAuth user (no password hash)
        if (user.getPasswordHash() != null) {
            throw new RuntimeException(
                    "This endpoint is only for OAuth users. Please use the regular email change endpoint.");
        }

        // Check if new email is different from current email
        if (newEmail.equalsIgnoreCase(user.getEmail())) {
            throw new RuntimeException("New email must be different from current email");
        }

        // Check if new email is already in use
        if (userRepository.existsByEmail(newEmail)) {
            throw new RuntimeException("Email address is already in use");
        }

        // Delete any existing unused email change tokens for this user
        emailChangeTokenRepository.deleteAllByUser(user);

        // Generate email change token
        String changeToken = generateEmailChangeToken(user, newEmail);

        // Send verification email to new email address
        emailService.sendEmailChangeVerificationEmail(user, newEmail, changeToken);

        log.info("OAuth email change verification sent to: {} for user: {} from IP: {}", newEmail, user.getEmail(),
                ipAddress);
    }

    public void verifyEmailChange(String token) {
        EmailChangeToken changeToken = emailChangeTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid email change token"));

        if (!changeToken.isValid()) {
            throw new RuntimeException("Email change token has expired or already been used");
        }

        User user = changeToken.getUser();
        String oldEmail = user.getEmail();
        String newEmail = changeToken.getNewEmail();

        // Update user email
        user.setEmail(newEmail);
        user.setEmailVerified(true); // New email is verified by this process
        userRepository.save(user);

        // Mark token as used
        changeToken.setUsed(true);
        changeToken.setUsedAt(LocalDateTime.now());
        emailChangeTokenRepository.save(changeToken);

        // Send notification to old email
        try {
            emailService.sendEmailChangeNotification(user, oldEmail);
        } catch (Exception e) {
            log.warn("Failed to send email change notification to old email: {}", oldEmail, e);
        }

        log.info("Email changed successfully for user: {} from {} to {}", user.getUsername(), oldEmail, newEmail);
    }

    public void resendEmailChangeVerification(UUID userId, String newEmail) {
        User user = getCurrentUser(userId);

        // Check if there's a pending email change for this user and email
        EmailChangeToken existingToken = emailChangeTokenRepository.findByUserAndNewEmail(user, newEmail)
                .orElseThrow(() -> new RuntimeException("No pending email change found for this email"));

        if (!existingToken.isValid()) {
            // Delete expired token and create new one
            emailChangeTokenRepository.delete(existingToken);
            String newToken = generateEmailChangeToken(user, newEmail);
            emailService.sendEmailChangeVerificationEmail(user, newEmail, newToken);
        } else {
            // Resend with existing token
            emailService.sendEmailChangeVerificationEmail(user, newEmail, existingToken.getToken());
        }

        log.info("Email change verification resent to: {} for user: {}", newEmail, user.getEmail());
    }

    private String generateEmailChangeToken(User user, String newEmail) {
        String token = UUID.randomUUID().toString();

        EmailChangeToken changeToken = EmailChangeToken.builder()
                .user(user)
                .token(token)
                .newEmail(newEmail)
                .expiresAt(LocalDateTime.now().plusHours(emailChangeExpiryHours))
                .build();

        emailChangeTokenRepository.save(changeToken);
        return token;
    }

    public void changeUsername(UUID userId, String currentPassword, String newUsername, String ipAddress,
            String userAgent) {
        User user = getCurrentUser(userId);

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Check if new username is different from current username
        if (newUsername.equalsIgnoreCase(user.getUsername())) {
            throw new RuntimeException("New username must be different from current username");
        }

        // Check if new username is already in use
        if (userRepository.existsByUsername(newUsername)) {
            throw new RuntimeException("Username is already taken");
        }

        // Update username
        String oldUsername = user.getUsername();
        user.setUsername(newUsername);
        userRepository.save(user);

        log.info("Username changed successfully for user: {} from {} to {} from IP: {}", user.getEmail(), oldUsername,
                newUsername, ipAddress);
    }

    public void changeUsernameOAuth(UUID userId, String newUsername, String ipAddress, String userAgent) {
        User user = getCurrentUser(userId);

        // Check if user is OAuth user (no password hash)
        if (user.getPasswordHash() != null) {
            throw new RuntimeException(
                    "This endpoint is only for OAuth users. Please use the regular username change endpoint.");
        }

        // Check if new username is different from current username
        if (newUsername.equalsIgnoreCase(user.getUsername())) {
            throw new RuntimeException("New username must be different from current username");
        }

        // Check if new username is already in use
        if (userRepository.existsByUsername(newUsername)) {
            throw new RuntimeException("Username is already taken");
        }

        // Update username
        String oldUsername = user.getUsername();
        user.setUsername(newUsername);
        userRepository.save(user);

        log.info("OAuth username changed successfully for user: {} from {} to {} from IP: {}", user.getEmail(),
                oldUsername, newUsername, ipAddress);
    }
}