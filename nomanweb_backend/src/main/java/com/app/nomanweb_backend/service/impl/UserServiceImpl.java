package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.entity.UserFollow;
import com.app.nomanweb_backend.repository.*;
import com.app.nomanweb_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserFollowRepository userFollowRepository;
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final ReadingProgressRepository readingProgressRepository;
    private final CoinTransactionRepository coinTransactionRepository;

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getUserStats(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Map<String, Object> stats = new HashMap<>();

        // Basic user info
        stats.put("userId", user.getId().toString());

        // Story and chapter counts
        long writtenBooks = storyRepository.countByAuthorIdAndStatus(userId, "PUBLISHED");
        stats.put("writtenBooks", writtenBooks);

        // Follower counts
        long followers = userFollowRepository.countByFollowingId(userId);
        long following = userFollowRepository.countByFollowerId(userId);
        stats.put("followers", followers);
        stats.put("following", following);

        // Reading statistics
        long booksCompleted = readingProgressRepository.countCompletedBooksByUser(userId);
        stats.put("booksCompleted", booksCompleted);

        // Additional stats
        stats.put("totalEarnedCoins", user.getTotalEarnedCoins());
        stats.put("totalViews", getTotalViewsForUser(userId));
        stats.put("totalLikes", getTotalLikesForUser(userId));

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Map<String, Object>> getFollowers(UUID userId, Pageable pageable) {
        Page<UserFollow> followersPage = userFollowRepository.findFollowersByUserId(userId, pageable);

        List<Map<String, Object>> followers = followersPage.getContent().stream()
                .map(userFollow -> {
                    User follower = userFollow.getFollower();
                    Map<String, Object> followerData = new HashMap<>();
                    followerData.put("id", follower.getId().toString());
                    followerData.put("username", follower.getUsername());
                    followerData.put("displayName", follower.getDisplayName());
                    followerData.put("profileImageUrl", follower.getProfileImageUrl());
                    followerData.put("followedAt", userFollow.getCreatedAt());
                    return followerData;
                })
                .collect(Collectors.toList());

        return new PageImpl<>(followers, pageable, followersPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Map<String, Object>> getFollowing(UUID userId, Pageable pageable) {
        Page<UserFollow> followingPage = userFollowRepository.findFollowingByUserId(userId, pageable);

        List<Map<String, Object>> following = followingPage.getContent().stream()
                .map(userFollow -> {
                    User followingUser = userFollow.getFollowing();
                    Map<String, Object> followingData = new HashMap<>();
                    followingData.put("id", followingUser.getId().toString());
                    followingData.put("username", followingUser.getUsername());
                    followingData.put("displayName", followingUser.getDisplayName());
                    followingData.put("profileImageUrl", followingUser.getProfileImageUrl());
                    followingData.put("followedAt", userFollow.getCreatedAt());
                    return followingData;
                })
                .collect(Collectors.toList());

        return new PageImpl<>(following, pageable, followingPage.getTotalElements());
    }

    @Override
    public void followUser(UUID followerId, UUID followingId) {
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("User cannot follow themselves");
        }

        // Check if both users exist
        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new IllegalArgumentException("Follower user not found"));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new IllegalArgumentException("Following user not found"));

        // Check if already following
        if (userFollowRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw new IllegalArgumentException("Already following this user");
        }

        // Create follow relationship
        UserFollow userFollow = UserFollow.builder()
                .follower(follower)
                .following(following)
                .createdAt(LocalDateTime.now())
                .build();

        userFollowRepository.save(userFollow);
        log.info("User {} started following user {}", followerId, followingId);
    }

    @Override
    public void unfollowUser(UUID followerId, UUID followingId) {
        if (!userFollowRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw new IllegalArgumentException("Not following this user");
        }

        userFollowRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);
        log.info("User {} unfollowed user {}", followerId, followingId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFollowing(UUID followerId, UUID followingId) {
        return userFollowRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getUserProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId().toString());
        profile.put("email", user.getEmail());
        profile.put("username", user.getUsername());
        profile.put("displayName", user.getDisplayName());
        profile.put("profileImageUrl", user.getProfileImageUrl());
        profile.put("bio", user.getBio());
        profile.put("role", user.getRole().toString());
        profile.put("status", user.getStatus().toString());
        profile.put("coinBalance", user.getCoinBalance());
        profile.put("totalEarnedCoins", user.getTotalEarnedCoins());
        profile.put("emailVerified", user.getEmailVerified());
        profile.put("createdAt", user.getCreatedAt());
        profile.put("updatedAt", user.getUpdatedAt());

        // Add statistics
        profile.put("stats", getUserStats(userId));

        return profile;
    }

    private long getTotalViewsForUser(UUID userId) {
        try {
            return storyRepository.getTotalViewsByAuthor(userId);
        } catch (Exception e) {
            log.warn("Could not get total views for user {}: {}", userId, e.getMessage());
            return 0;
        }
    }

    private long getTotalLikesForUser(UUID userId) {
        try {
            return storyRepository.getTotalLikesByAuthor(userId);
        } catch (Exception e) {
            log.warn("Could not get total likes for user {}: {}", userId, e.getMessage());
            return 0;
        }
    }
}