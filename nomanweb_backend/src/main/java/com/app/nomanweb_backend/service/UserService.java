package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;
import java.util.UUID;

public interface UserService {

    // Get user statistics
    Map<String, Object> getUserStats(UUID userId);

    // Get user's followers
    Page<Map<String, Object>> getFollowers(UUID userId, Pageable pageable);

    // Get user's following
    Page<Map<String, Object>> getFollowing(UUID userId, Pageable pageable);

    // Follow/Unfollow operations
    void followUser(UUID followerId, UUID followingId);

    void unfollowUser(UUID followerId, UUID followingId);

    boolean isFollowing(UUID followerId, UUID followingId);

    // Get user profile information
    Map<String, Object> getUserProfile(UUID userId);

    // Search users by email, username, or display name
    Page<Map<String, Object>> searchUsers(String query, Pageable pageable);

    // Get user by ID
    User getUserById(UUID userId);

    // Update user
    User updateUser(User user);
}