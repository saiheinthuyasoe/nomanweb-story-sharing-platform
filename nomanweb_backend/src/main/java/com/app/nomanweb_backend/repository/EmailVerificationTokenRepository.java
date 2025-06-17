package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.EmailVerificationToken;
import com.app.nomanweb_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {

    Optional<EmailVerificationToken> findByToken(String token);

    Optional<EmailVerificationToken> findByUserAndUsedFalse(User user);

    @Query("SELECT evt FROM EmailVerificationToken evt WHERE evt.user = :user AND evt.used = false AND evt.expiresAt > :now")
    Optional<EmailVerificationToken> findValidTokenByUser(@Param("user") User user, @Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM EmailVerificationToken evt WHERE evt.expiresAt < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM EmailVerificationToken evt WHERE evt.user = :user")
    void deleteAllByUser(@Param("user") User user);

    boolean existsByUserAndUsedFalse(User user);
}