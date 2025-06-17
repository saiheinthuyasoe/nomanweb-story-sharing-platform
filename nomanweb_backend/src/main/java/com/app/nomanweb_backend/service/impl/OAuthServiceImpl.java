package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.auth.LoginResponse;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.service.FirebaseService;
import com.app.nomanweb_backend.service.LineOAuthService;
import com.app.nomanweb_backend.service.OAuthService;
import com.app.nomanweb_backend.util.JwtUtil;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OAuthServiceImpl implements OAuthService {

    private final FirebaseService firebaseService;
    private final LineOAuthService lineOAuthService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Override
    public LoginResponse authenticateWithGoogle(String idToken) {
        try {
            // Verify Google token
            Object tokenResult = firebaseService.verifyGoogleToken(idToken);

            String googleId = firebaseService.extractGoogleId(tokenResult);
            String email = firebaseService.extractEmail(tokenResult);
            String name = firebaseService.extractName(tokenResult);
            String picture = firebaseService.extractPicture(tokenResult);
            boolean emailVerified = firebaseService.isEmailVerified(tokenResult);

            // Check if user exists by Google ID
            Optional<User> existingUser = userRepository.findByGoogleId(googleId);

            User user;
            if (existingUser.isPresent()) {
                // Existing user - update login time
                user = existingUser.get();
                user.setLastLoginAt(LocalDateTime.now());

                // Update profile if needed
                if (picture != null && !picture.equals(user.getProfileImageUrl())) {
                    user.setProfileImageUrl(picture);
                }
            } else {
                // Check if user exists by email
                Optional<User> userByEmail = userRepository.findByEmail(email);

                if (userByEmail.isPresent()) {
                    // Link Google account to existing user
                    user = userByEmail.get();
                    user.setGoogleId(googleId);
                    user.setLastLoginAt(LocalDateTime.now());

                    if (picture != null) {
                        user.setProfileImageUrl(picture);
                    }
                } else {
                    // Create new user
                    user = User.builder()
                            .email(email)
                            .username(generateUsernameFromEmail(email))
                            .displayName(name)
                            .googleId(googleId)
                            .profileImageUrl(picture)
                            .role(User.Role.USER)
                            .status(User.Status.ACTIVE)
                            .emailVerified(emailVerified) // Google emails are pre-verified
                            .lastLoginAt(LocalDateTime.now())
                            .build();
                }
            }

            user = userRepository.save(user);

            // Generate JWT tokens
            String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
            String refreshToken = jwtUtil.generateRefreshToken(user.getId());

            log.info("Google OAuth successful for user: {}", user.getEmail());

            return LoginResponse.builder()
                    .user(user)
                    .token(token)
                    .refreshToken(refreshToken)
                    .build();

        } catch (Exception e) {
            log.error("Google OAuth authentication failed", e);
            throw new RuntimeException("Google authentication failed");
        }
    }

    @Override
    public LoginResponse authenticateWithLine(String accessToken) {
        try {
            // Get LINE user profile
            var lineProfile = lineOAuthService.getUserProfile(accessToken);

            String lineUserId = lineProfile.getUserId();
            String displayName = lineProfile.getDisplayName();
            String pictureUrl = lineProfile.getPictureUrl();

            // Check if user exists by LINE ID
            Optional<User> existingUser = userRepository.findByLineUserId(lineUserId);

            User user;
            if (existingUser.isPresent()) {
                // Existing user - update login time
                user = existingUser.get();
                user.setLastLoginAt(LocalDateTime.now());

                // Update profile if needed
                if (pictureUrl != null && !pictureUrl.equals(user.getProfileImageUrl())) {
                    user.setProfileImageUrl(pictureUrl);
                }
            } else {
                // Create new user (LINE doesn't provide email, so we'll need to collect it
                // later)
                String tempEmail = generateUsernameFromLineId(lineUserId) + "@line.temp";
                user = User.builder()
                        .email(tempEmail) // Set temporary email to satisfy validation
                        .username(generateUsernameFromLineId(lineUserId))
                        .displayName(displayName)
                        .lineUserId(lineUserId)
                        .profileImageUrl(pictureUrl)
                        .role(User.Role.USER)
                        .status(User.Status.ACTIVE)
                        .emailVerified(false) // Will need to collect email separately
                        .lastLoginAt(LocalDateTime.now())
                        .build();
            }

            user = userRepository.save(user);

            // Generate JWT tokens - handle case where email might be null
            String userEmail = user.getEmail() != null ? user.getEmail() : user.getUsername() + "@line.temp";
            String token = jwtUtil.generateToken(user.getId(), userEmail, user.getRole().name());
            String refreshToken = jwtUtil.generateRefreshToken(user.getId());

            log.info("LINE OAuth successful for user: {}", user.getLineUserId());

            return LoginResponse.builder()
                    .user(user)
                    .token(token)
                    .refreshToken(refreshToken)
                    .build();

        } catch (Exception e) {
            log.error("LINE OAuth authentication failed", e);
            throw new RuntimeException("LINE authentication failed");
        }
    }

    @Override
    public void linkGoogleAccount(String userId, String idToken) {
        try {
            Object tokenResult = firebaseService.verifyGoogleToken(idToken);
            String googleId = firebaseService.extractGoogleId(tokenResult);

            User user = userRepository.findById(UUID.fromString(userId))
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if Google account is already linked to another user
            Optional<User> existingGoogleUser = userRepository.findByGoogleId(googleId);
            if (existingGoogleUser.isPresent() && !existingGoogleUser.get().getId().equals(user.getId())) {
                throw new RuntimeException("Google account is already linked to another user");
            }

            user.setGoogleId(googleId);
            userRepository.save(user);

            log.info("Google account linked successfully for user: {}", user.getEmail());

        } catch (Exception e) {
            log.error("Failed to link Google account", e);
            throw new RuntimeException("Failed to link Google account");
        }
    }

    @Override
    public void linkLineAccount(String userId, String accessToken) {
        try {
            var lineProfile = lineOAuthService.getUserProfile(accessToken);
            String lineUserId = lineProfile.getUserId();

            User user = userRepository.findById(UUID.fromString(userId))
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if LINE account is already linked to another user
            Optional<User> existingLineUser = userRepository.findByLineUserId(lineUserId);
            if (existingLineUser.isPresent() && !existingLineUser.get().getId().equals(user.getId())) {
                throw new RuntimeException("LINE account is already linked to another user");
            }

            user.setLineUserId(lineUserId);
            userRepository.save(user);

            log.info("LINE account linked successfully for user: {}", user.getEmail());

        } catch (Exception e) {
            log.error("Failed to link LINE account", e);
            throw new RuntimeException("Failed to link LINE account");
        }
    }

    private String generateUsernameFromEmail(String email) {
        String baseUsername = email.substring(0, email.indexOf('@'));
        String username = baseUsername.replaceAll("[^a-zA-Z0-9_]", "_");

        // Ensure uniqueness
        String finalUsername = username;
        int counter = 1;
        while (userRepository.existsByUsername(finalUsername)) {
            finalUsername = username + "_" + counter;
            counter++;
        }

        return finalUsername;
    }

    private String generateUsernameFromLineId(String lineUserId) {
        String baseUsername = "line_" + lineUserId.substring(0, Math.min(lineUserId.length(), 10));

        // Ensure uniqueness
        String finalUsername = baseUsername;
        int counter = 1;
        while (userRepository.existsByUsername(finalUsername)) {
            finalUsername = baseUsername + "_" + counter;
            counter++;
        }

        return finalUsername;
    }
}