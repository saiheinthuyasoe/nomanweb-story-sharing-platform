package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.PasswordResetAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface PasswordResetAttemptRepository extends JpaRepository<PasswordResetAttempt, UUID> {

    /**
     * Count password reset attempts by email within a time window
     */
    @Query("SELECT COUNT(p) FROM PasswordResetAttempt p WHERE p.email = :email AND p.createdAt >= :since")
    long countByEmailAndCreatedAtAfter(@Param("email") String email, @Param("since") LocalDateTime since);

    /**
     * Count password reset attempts by IP address within a time window
     */
    @Query("SELECT COUNT(p) FROM PasswordResetAttempt p WHERE p.ipAddress = :ipAddress AND p.createdAt >= :since")
    long countByIpAddressAndCreatedAtAfter(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    /**
     * Count successful password reset attempts by email within a time window
     */
    @Query("SELECT COUNT(p) FROM PasswordResetAttempt p WHERE p.email = :email AND p.success = true AND p.createdAt >= :since")
    long countSuccessfulByEmailAndCreatedAtAfter(@Param("email") String email, @Param("since") LocalDateTime since);

    /**
     * Find recent attempts by email
     */
    @Query("SELECT p FROM PasswordResetAttempt p WHERE p.email = :email ORDER BY p.createdAt DESC")
    List<PasswordResetAttempt> findByEmailOrderByCreatedAtDesc(@Param("email") String email);

    /**
     * Find recent attempts by IP address
     */
    @Query("SELECT p FROM PasswordResetAttempt p WHERE p.ipAddress = :ipAddress ORDER BY p.createdAt DESC")
    List<PasswordResetAttempt> findByIpAddressOrderByCreatedAtDesc(@Param("ipAddress") String ipAddress);

    /**
     * Delete old password reset attempts (for cleanup)
     */
    @Query("DELETE FROM PasswordResetAttempt p WHERE p.createdAt < :before")
    void deleteByCreatedAtBefore(@Param("before") LocalDateTime before);

    /**
     * Find attempts within time range for analytics
     */
    @Query("SELECT p FROM PasswordResetAttempt p WHERE p.createdAt BETWEEN :start AND :end ORDER BY p.createdAt DESC")
    List<PasswordResetAttempt> findByCreatedAtBetween(@Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}