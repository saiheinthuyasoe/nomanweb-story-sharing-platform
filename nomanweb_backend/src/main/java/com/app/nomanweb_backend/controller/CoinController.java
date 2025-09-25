package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.service.AuthService;
import com.app.nomanweb_backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/coins")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001", "https://nomanweb-story-sharing-platform-pbc.vercel.app" })
@Slf4j
public class CoinController {

    private final JwtUtil jwtUtil;
    private final AuthService authService;

    // SSE emitters for coin balance updates (shared with AdminCoinController)
    public static final Map<UUID, SseEmitter> coinBalanceEmitters = new ConcurrentHashMap<>();

    // SSE endpoint for coin balance updates (accessible to all authenticated users)
    @GetMapping(value = "/sse/balance-updates", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('USER')")
    public SseEmitter subscribeToBalanceUpdates(HttpServletRequest request, HttpServletResponse response) {
        try {
            UUID userId = getCurrentUserId(request);
            
            // Set proper headers for SSE to prevent chunked encoding issues
            response.setHeader("Cache-Control", "no-cache");
            response.setHeader("Connection", "keep-alive");
            response.setHeader("Content-Type", "text/event-stream");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Headers", "Cache-Control");
            
            // Use a shorter timeout to prevent connection issues
            SseEmitter emitter = new SseEmitter(300000L); // 5 minutes instead of Long.MAX_VALUE

            // Store emitter for this user
            coinBalanceEmitters.put(userId, emitter);
            log.info("✅ User {} connected to SSE balance updates. Total connections: {}", userId, coinBalanceEmitters.size());

            // Send initial connection message with proper formatting
            try {
                emitter.send(SseEmitter.event()
                        .name("connected")
                        .data(Map.of("message", "Connected to coin balance updates", "userId", userId.toString())));
                
                // Send a heartbeat immediately to establish the connection
                emitter.send(SseEmitter.event()
                        .name("heartbeat")
                        .data(Map.of("timestamp", System.currentTimeMillis())));
                        
            } catch (IOException e) {
                log.error("Error sending initial SSE message to user: {}", userId, e);
                coinBalanceEmitters.remove(userId);
                throw new RuntimeException("Failed to send initial SSE message", e);
            }

            // Handle client disconnect
            emitter.onCompletion(() -> {
                coinBalanceEmitters.remove(userId);
                log.info("SSE connection closed for user: {}", userId);
            });

            emitter.onTimeout(() -> {
                coinBalanceEmitters.remove(userId);
                log.info("SSE connection timeout for user: {}", userId);
            });

            emitter.onError((ex) -> {
                coinBalanceEmitters.remove(userId);
                log.error("SSE connection error for user: {}", userId, ex);
            });

            log.info("User {} subscribed to coin balance updates", userId);
            return emitter;
        } catch (Exception e) {
            log.error("Error creating SSE connection for balance updates", e);
            throw new RuntimeException("Failed to create SSE connection", e);
        }
    }

    // Broadcast coin balance update to specific user (static method accessible from
    // AdminCoinController)
    public static void broadcastCoinBalanceUpdate(UUID userId, BigDecimal newBalance) {
        long startTime = System.currentTimeMillis();
        SseEmitter emitter = coinBalanceEmitters.get(userId);
        log.info("Attempting to broadcast balance update to user {}: {} at {}", userId, newBalance, LocalDateTime.now());
        log.info("Active SSE connections: {}", coinBalanceEmitters.keySet());
        
        if (emitter != null) {
            try {
                Map<String, Object> update = new HashMap<>();
                update.put("type", "balance_update");
                update.put("userId", userId.toString());
                update.put("newBalance", newBalance);
                update.put("timestamp", LocalDateTime.now());

                emitter.send(SseEmitter.event()
                        .name("balance_update")
                        .data(update));

                long endTime = System.currentTimeMillis();
                log.info("✅ Successfully broadcasted balance update to user {}: {} in {}ms", userId, newBalance, (endTime - startTime));
            } catch (IOException e) {
                log.error("❌ Error broadcasting balance update to user: {}", userId, e);
                coinBalanceEmitters.remove(userId);
            }
        } else {
            log.warn("⚠️ No SSE emitter found for user: {}. User may not be connected to SSE endpoint.", userId);
        }
    }

    private UUID getCurrentUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.getUserIdFromToken(token);
        }
        throw new RuntimeException("No valid authorization token found");
    }
}