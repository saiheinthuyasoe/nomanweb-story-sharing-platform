package com.app.nomanweb_backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - no authentication required
                        .requestMatchers(HttpMethod.GET, "/api/stories").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/stories/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/slug/{slug}").permitAll()

                        // Chapter endpoints - public read access to published chapters
                        .requestMatchers(HttpMethod.GET, "/api/chapters/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/chapters/story/{storyId}/chapter/{chapterNumber}")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/chapters/story/{storyId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/chapters/story/{storyId}/paged").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/chapters/story/{storyId}/first").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/chapters/story/{storyId}/last").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/chapters/{id}/next").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/chapters/{id}/previous").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/chapters/story/{storyId}/search").permitAll()

                        // Auth endpoints
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/register").permitAll()
                        .requestMatchers("/api/auth/forgot-password").permitAll()
                        .requestMatchers("/api/auth/reset-password").permitAll()
                        .requestMatchers("/api/auth/verify-email").permitAll()
                        .requestMatchers("/api/auth/resend-verification").permitAll()

                        // OAuth endpoints
                        .requestMatchers("/api/oauth/**").permitAll()

                        // Protected endpoints - authentication required
                        .requestMatchers("/api/auth/profile").authenticated()
                        .requestMatchers("/api/auth/logout").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/stories").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/stories/{id}").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/stories/{id}").authenticated()
                        .requestMatchers("/api/stories/my-stories").authenticated()
                        .requestMatchers("/api/stories/{id}/publish").authenticated()
                        .requestMatchers("/api/stories/{id}/unpublish").authenticated()

                        // Chapter management endpoints - require authentication
                        .requestMatchers(HttpMethod.POST, "/api/chapters").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/chapters/{id}").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/chapters/{id}").authenticated()
                        .requestMatchers("/api/chapters/{id}/publish").authenticated()
                        .requestMatchers("/api/chapters/{id}/unpublish").authenticated()
                        .requestMatchers("/api/chapters/{id}/autosave").authenticated()
                        .requestMatchers("/api/chapters/story/{storyId}/reorder").authenticated()

                        // All other requests require authentication
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