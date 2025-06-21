package com.app.nomanweb_backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final GlobalExceptionHandler globalExceptionHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authz -> authz
                        // Public endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/oauth/**").permitAll()
                        .requestMatchers("/api/upload/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/stories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/chapters/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/search/**").permitAll()

                        // Admin authentication endpoints - public access for login/register
                        .requestMatchers("/api/admin/auth/login", "/api/admin/auth/register",
                                "/api/admin/auth/invitation/validate/**")
                        .permitAll()

                        // Admin-only endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/chapters/*/moderate").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/chapters/moderation").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/stories/*/moderate").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/stories/moderation").hasRole("ADMIN")

                        // Authenticated endpoints
                        .requestMatchers(HttpMethod.POST, "/api/stories/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/stories/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/stories/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/chapters/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/chapters/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/chapters/**").authenticated()
                        .requestMatchers("/api/reading-progress/**").authenticated()
                        .requestMatchers("/api/reading-lists/**").authenticated()
                        .requestMatchers("/api/reactions/**").authenticated()

                        // User endpoints - all require authentication
                        .requestMatchers("/api/users/**").authenticated()

                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:3000", "http://localhost:3001"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}