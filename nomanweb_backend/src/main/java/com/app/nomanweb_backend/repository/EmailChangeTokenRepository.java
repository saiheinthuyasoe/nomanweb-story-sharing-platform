package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.EmailChangeToken;
import com.app.nomanweb_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailChangeTokenRepository extends JpaRepository<EmailChangeToken, UUID> {

    Optional<EmailChangeToken> findByToken(String token);

    Optional<EmailChangeToken> findByUserAndNewEmail(User user, String newEmail);

    @Modifying
    @Query("DELETE FROM EmailChangeToken e WHERE e.user = :user")
    void deleteAllByUser(@Param("user") User user);

    @Modifying
    @Query("DELETE FROM EmailChangeToken e WHERE e.expiresAt < CURRENT_TIMESTAMP")
    void deleteExpiredTokens();
}