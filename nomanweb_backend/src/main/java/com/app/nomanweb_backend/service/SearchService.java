package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.User;

import java.util.List;
import java.util.UUID;

public interface SearchService {

    // Story search methods
    List<Story> searchStories(String query, int page, int size);

    List<Story> searchStoriesByCategory(String categorySlug, String query, int page, int size);

    List<Story> searchStoriesByAuthor(UUID authorId, String query, int page, int size);

    List<Story> getPopularStories(int page, int size);

    List<Story> getRecentStories(int page, int size);

    List<Story> getFeaturedStories(int page, int size);

    // User search methods
    List<User> searchUsers(String query, int page, int size);

    List<User> searchAuthors(String query, int page, int size);

    // Index management methods
    void indexStory(Story story);

    void updateStoryIndex(Story story);

    void removeStoryFromIndex(UUID storyId);

    void indexUser(User user);

    void updateUserIndex(User user);

    void removeUserFromIndex(UUID userId);

    // Analytics and recommendations
    List<Story> getRecommendedStories(UUID userId, int page, int size);

    List<Story> getSimilarStories(UUID storyId, int limit);

    // Search suggestions
    List<String> getSearchSuggestions(String query, int limit);
}