package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmailOrUsername(String email, String username);

    Optional<User> findByUsernameOrEmail(String username, String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    Optional<User> findByPasswordResetToken(String token);

    Optional<User> findByLineUserId(String lineUserId);

    Optional<User> findByGoogleId(String googleId);

    @Query("SELECT u FROM User u WHERE u.status = 'ACTIVE' AND u.emailVerified = true")
    java.util.List<User> findActiveVerifiedUsers();

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :startDate")
    long countUsersCreatedAfter(@Param("startDate") java.time.LocalDateTime startDate);

    // Search users by username, display name, or email
    @Query("SELECT u FROM User u WHERE u.status = 'ACTIVE' AND (LOWER(u.username) LIKE LOWER(:query) OR LOWER(u.displayName) LIKE LOWER(:query) OR LOWER(u.email) LIKE LOWER(:query))")
    java.util.List<User> findByUsernameContainingIgnoreCaseOrDisplayNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            @Param("query") String query);
}