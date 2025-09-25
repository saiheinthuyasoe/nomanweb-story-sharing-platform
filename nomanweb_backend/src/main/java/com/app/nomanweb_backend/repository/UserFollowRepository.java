package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.entity.UserFollow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, UUID> {

    // Find follow relationship between two users
    Optional<UserFollow> findByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    // Check if user follows another user
    boolean existsByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    // Get followers of a user
    @Query("SELECT uf FROM UserFollow uf WHERE uf.following.id = :userId ORDER BY uf.createdAt DESC")
    Page<UserFollow> findFollowersByUserId(@Param("userId") UUID userId, Pageable pageable);

    // Get users that a user is following
    @Query("SELECT uf FROM UserFollow uf WHERE uf.follower.id = :userId ORDER BY uf.createdAt DESC")
    Page<UserFollow> findFollowingByUserId(@Param("userId") UUID userId, Pageable pageable);

    // Count followers
    long countByFollowingId(UUID userId);

    // Count following
    long countByFollowerId(UUID userId);

    // Delete follow relationship
    void deleteByFollowerIdAndFollowingId(UUID followerId, UUID followingId);
}