package com.app.nomanweb_backend;

import com.app.nomanweb_backend.dto.auth.LoginRequest;
import com.app.nomanweb_backend.dto.auth.LoginResponse;
import com.app.nomanweb_backend.entity.RefreshToken;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.RefreshTokenRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.service.AuthService;
import com.app.nomanweb_backend.service.RefreshTokenService;
import com.app.nomanweb_backend.util.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
public class RefreshTokenIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    public void testRefreshTokenFlow() throws Exception {
        // 1. Create a test user
        User testUser = User.builder()
                .email("test@example.com")
                .username("testuser")
                .displayName("Test User")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(User.Role.USER)
                .status(User.Status.ACTIVE)
                .emailVerified(true)
                .build();

        User savedUser = userRepository.save(testUser);

        // 2. Login to get tokens
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse loginResponse = objectMapper.readValue(
                loginResult.getResponse().getContentAsString(), LoginResponse.class);

        assertNotNull(loginResponse.getToken());
        assertNotNull(loginResponse.getRefreshToken());
        assertNotNull(loginResponse.getUser());

        // 3. Verify refresh token is stored in database
        RefreshToken storedToken = refreshTokenRepository.findByToken(loginResponse.getRefreshToken())
                .orElse(null);
        assertNotNull(storedToken);
        assertTrue(storedToken.isValid());

        // 4. Test refresh token endpoint
        Map<String, String> refreshRequest = Map.of("refreshToken", loginResponse.getRefreshToken());

        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse refreshResponse = objectMapper.readValue(
                refreshResult.getResponse().getContentAsString(), LoginResponse.class);

        assertNotNull(refreshResponse.getToken());
        assertNotNull(refreshResponse.getRefreshToken());
        assertNotEquals(loginResponse.getToken(), refreshResponse.getToken());
        assertNotEquals(loginResponse.getRefreshToken(), refreshResponse.getRefreshToken());

        // 5. Verify old refresh token is revoked
        RefreshToken oldToken = refreshTokenRepository.findByToken(loginResponse.getRefreshToken())
                .orElse(null);
        assertNotNull(oldToken);
        assertTrue(oldToken.isRevoked());

        // 6. Verify new refresh token is valid
        RefreshToken newToken = refreshTokenRepository.findByToken(refreshResponse.getRefreshToken())
                .orElse(null);
        assertNotNull(newToken);
        assertTrue(newToken.isValid());

        // 7. Test logout
        Map<String, String> logoutRequest = Map.of("refreshToken", refreshResponse.getRefreshToken());

        mockMvc.perform(post("/api/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isOk());

        // 8. Verify refresh token is revoked after logout
        RefreshToken loggedOutToken = refreshTokenRepository.findByToken(refreshResponse.getRefreshToken())
                .orElse(null);
        assertNotNull(loggedOutToken);
        assertTrue(loggedOutToken.isRevoked());
    }

    @Test
    public void testInvalidRefreshToken() throws Exception {
        Map<String, String> invalidRefreshRequest = Map.of("refreshToken", "invalid-token");

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRefreshRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testExpiredRefreshToken() throws Exception {
        // Create a test user
        User testUser = User.builder()
                .email("test2@example.com")
                .username("testuser2")
                .displayName("Test User 2")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(User.Role.USER)
                .status(User.Status.ACTIVE)
                .emailVerified(true)
                .build();

        User savedUser = userRepository.save(testUser);

        // Create an expired refresh token
        RefreshToken expiredToken = RefreshToken.builder()
                .token(jwtUtil.generateRefreshToken(savedUser.getId()))
                .user(savedUser)
                .expiresAt(java.time.LocalDateTime.now().minusHours(1)) // Expired 1 hour ago
                .build();

        refreshTokenRepository.save(expiredToken);

        Map<String, String> expiredRefreshRequest = Map.of("refreshToken", expiredToken.getToken());

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(expiredRefreshRequest)))
                .andExpect(status().isUnauthorized());
    }
}