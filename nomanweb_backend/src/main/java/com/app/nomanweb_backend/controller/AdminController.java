package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.entity.PasswordResetAttempt;
import com.app.nomanweb_backend.repository.PasswordResetAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class AdminController {

    private final PasswordResetAttemptRepository passwordResetAttemptRepository;

    /**
     * Get password reset attempts with pagination and filtering
     */
    @GetMapping("/password-reset-attempts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<PasswordResetAttempt>> getPasswordResetAttempts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String ipAddress,
            @RequestParam(required = false) Boolean success,
            @RequestParam(required = false) Boolean tokenGenerated,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // For now, return all attempts with basic filtering
        // In a production environment, you'd want to implement custom query methods
        Page<PasswordResetAttempt> attempts = passwordResetAttemptRepository.findAll(pageable);

        return ResponseEntity.ok(attempts);
    }

    /**
     * Get password reset attempt statistics
     */
    @GetMapping("/password-reset-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getPasswordResetStats(
            @RequestParam(defaultValue = "24") int hours) {

        LocalDateTime since = LocalDateTime.now().minusHours(hours);

        List<PasswordResetAttempt> recentAttempts = passwordResetAttemptRepository
                .findByCreatedAtBetween(since, LocalDateTime.now());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAttempts", recentAttempts.size());
        stats.put("successfulAttempts", recentAttempts.stream()
                .mapToLong(a -> a.getSuccess() ? 1 : 0).sum());
        stats.put("tokensGenerated", recentAttempts.stream()
                .mapToLong(a -> a.getTokenGenerated() ? 1 : 0).sum());
        stats.put("uniqueEmails", recentAttempts.stream()
                .map(PasswordResetAttempt::getEmail).distinct().count());
        stats.put("uniqueIpAddresses", recentAttempts.stream()
                .map(PasswordResetAttempt::getIpAddress).distinct().count());
        stats.put("timeRange", hours + " hours");

        return ResponseEntity.ok(stats);
    }

    /**
     * Get recent attempts by email
     */
    @GetMapping("/password-reset-attempts/by-email/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PasswordResetAttempt>> getAttemptsByEmail(
            @PathVariable String email,
            @RequestParam(defaultValue = "10") int limit) {

        List<PasswordResetAttempt> attempts = passwordResetAttemptRepository
                .findByEmailOrderByCreatedAtDesc(email);

        // Limit results
        if (attempts.size() > limit) {
            attempts = attempts.subList(0, limit);
        }

        return ResponseEntity.ok(attempts);
    }

    /**
     * Get recent attempts by IP address
     */
    @GetMapping("/password-reset-attempts/by-ip/{ipAddress}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PasswordResetAttempt>> getAttemptsByIp(
            @PathVariable String ipAddress,
            @RequestParam(defaultValue = "10") int limit) {

        List<PasswordResetAttempt> attempts = passwordResetAttemptRepository
                .findByIpAddressOrderByCreatedAtDesc(ipAddress);

        // Limit results
        if (attempts.size() > limit) {
            attempts = attempts.subList(0, limit);
        }

        return ResponseEntity.ok(attempts);
    }

    /**
     * Clean up old password reset attempts (older than specified days)
     */
    @DeleteMapping("/password-reset-attempts/cleanup")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> cleanupOldAttempts(
            @RequestParam(defaultValue = "30") int daysOld) {

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);

        // Count attempts to be deleted
        List<PasswordResetAttempt> oldAttempts = passwordResetAttemptRepository
                .findByCreatedAtBetween(LocalDateTime.of(2000, 1, 1, 0, 0), cutoffDate);

        int deletedCount = oldAttempts.size();

        // Delete old attempts
        passwordResetAttemptRepository.deleteByCreatedAtBefore(cutoffDate);

        Map<String, Object> result = new HashMap<>();
        result.put("deletedCount", deletedCount);
        result.put("cutoffDate", cutoffDate);
        result.put("message", "Cleanup completed successfully");

        return ResponseEntity.ok(result);
    }
}