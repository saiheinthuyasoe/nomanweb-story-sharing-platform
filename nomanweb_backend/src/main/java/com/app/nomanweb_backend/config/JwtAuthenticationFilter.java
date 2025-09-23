package com.app.nomanweb_backend.config;

import com.app.nomanweb_backend.util.JwtUtil;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("No Authorization header or invalid format for request: {}", request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);
            log.debug("Processing JWT for request: {}", request.getRequestURI());

            // Check if token is expired first
            if (jwtUtil.isTokenExpired(jwt)) {
                log.debug("JWT token is expired for request: {}", request.getRequestURI());
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Access token expired\"}");
                return;
            }

            if (jwtUtil.validateToken(jwt) && SecurityContextHolder.getContext().getAuthentication() == null) {
                UUID userId = jwtUtil.getUserIdFromToken(jwt);
                String email = jwtUtil.getEmailFromToken(jwt);
                String role = jwtUtil.getRoleFromToken(jwt);

                log.debug("JWT validation successful for user: {} (email: {})", userId, email);

                // Verify user still exists and is active (or is admin)
                User user = userRepository.findById(userId).orElse(null);
                if (user != null && (user.isActive() || "ADMIN".equals(user.getRole().toString()))) {
                    List<SimpleGrantedAuthority> authorities = List.of(
                            new SimpleGrantedAuthority("ROLE_" + role));

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userId.toString(), null, authorities);
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("User {} authenticated via JWT for request: {}", email, request.getRequestURI());
                } else {
                    log.warn("User {} not found or inactive for request: {}", email, request.getRequestURI());
                    if (user == null) {
                        log.warn("User not found in database for ID: {}", userId);
                    } else {
                        log.warn("User is inactive: active={}, role={}", user.isActive(), user.getRole());
                    }
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter()
                            .write("{\"error\":\"Unauthorized\",\"message\":\"User not found or inactive\"}");
                    return;
                }
            } else {
                log.debug("JWT validation failed or authentication already exists for request: {}",
                        request.getRequestURI());
            }
        } catch (Exception e) {
            log.error("JWT authentication failed for request {}: {}", request.getRequestURI(), e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Invalid token\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();

        // Only exclude public auth endpoints, not all auth endpoints
        return path.equals("/api/auth/login") ||
                path.equals("/api/auth/register") ||
                path.equals("/api/auth/forgot-password") ||
                path.equals("/api/auth/reset-password") ||
                path.equals("/api/auth/verify-email") ||
                path.equals("/api/auth/resend-verification") ||
                path.equals("/api/auth/refresh") ||
                path.equals("/api/test/public") ||
                path.equals("/api/coins/packages") || // Public coin packages endpoint
                path.equals("/error") || // Exclude error page to prevent misleading auth errors
                path.startsWith("/api/oauth/") ||
                path.startsWith("/api/public/") ||
                path.startsWith("/actuator/health") ||
                path.startsWith("/swagger-ui/") ||
                path.startsWith("/v3/api-docs");
    }
}