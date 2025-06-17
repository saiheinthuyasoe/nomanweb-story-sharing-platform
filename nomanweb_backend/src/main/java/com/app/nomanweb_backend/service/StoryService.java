package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.story.CreateStoryRequest;
import com.app.nomanweb_backend.dto.story.UpdateStoryRequest;
import com.app.nomanweb_backend.dto.story.StoryResponse;
import com.app.nomanweb_backend.dto.story.StoryPreviewResponse;
import com.app.nomanweb_backend.entity.Story;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface StoryService {

    // Basic CRUD operations
    StoryResponse createStory(CreateStoryRequest request, UUID authorId);

    StoryResponse getStoryById(UUID storyId);

    StoryResponse updateStory(UUID storyId, UpdateStoryRequest request, UUID authorId);

    void deleteStory(UUID storyId, UUID authorId);

    // Story listing with pagination
    Page<StoryPreviewResponse> getPublishedStories(int page, int size, String sortBy);

    Page<StoryPreviewResponse> getStoriesByAuthor(UUID authorId, int page, int size);

    Page<StoryPreviewResponse> getStoriesByCategory(UUID categoryId, int page, int size);

    Page<StoryPreviewResponse> getMyStories(UUID authorId, int page, int size);

    // Advanced queries
    Page<StoryPreviewResponse> searchStories(String query, int page, int size);

    Page<StoryPreviewResponse> getTrendingStories(int page, int size);

    Page<StoryPreviewResponse> getFeaturedStories(int page, int size);

    Page<StoryPreviewResponse> getStoriesWithFilters(
            String status, UUID categoryId, String contentType, UUID authorId,
            String sortBy, int page, int size);

    // Story actions
    StoryResponse publishStory(UUID storyId, UUID authorId);

    StoryResponse unpublishStory(UUID storyId, UUID authorId);

    void incrementViews(UUID storyId);

    // Validation and authorization
    boolean isStoryOwner(UUID storyId, UUID userId);

    boolean canUserAccessStory(UUID storyId, UUID userId);
}