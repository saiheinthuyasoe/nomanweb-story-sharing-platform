package com.app.nomanweb_backend.config;

import com.app.nomanweb_backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            log.info("WebSocket connection attempt detected");

            // Get authorization header
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            if (authHeaders != null && !authHeaders.isEmpty()) {
                String authHeader = authHeaders.get(0);
                if (authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    try {
                        // Validate JWT token
                        UUID userId = jwtUtil.getUserIdFromToken(token);
                        if (userId != null) {
                            log.info("WebSocket authentication successful for user: {}", userId);
                            // Set user info in the session
                            accessor.setUser(() -> userId.toString());
                            return message;
                        }
                    } catch (Exception e) {
                        log.warn("WebSocket authentication failed: {}", e.getMessage());
                    }
                }
            }

            // If no valid token, still allow connection but log it
            log.info("WebSocket connection without authentication - allowing for now");
        }

        return message;
    }
}