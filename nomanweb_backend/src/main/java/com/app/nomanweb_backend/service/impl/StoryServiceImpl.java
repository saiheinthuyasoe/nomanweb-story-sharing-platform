package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.story.CreateStoryRequest;
import com.app.nomanweb_backend.dto.story.UpdateStoryRequest;
import com.app.nomanweb_backend.dto.story.StoryResponse;
import com.app.nomanweb_backend.dto.story.StoryPreviewResponse;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.entity.Category;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.repository.CategoryRepository;
import com.app.nomanweb_backend.service.StoryService;
import com.app.nomanweb_backend.service.SearchIndexingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StoryServiceImpl implements StoryService {

    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public StoryResponse createStory(CreateStoryRequest request, UUID authorId) {
        log.info("Creating story with title: {} for author: {}", request.getTitle(), authorId);

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Author not found"));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        Story story = Story.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .author(author)
                .category(category)
                .contentType(request.getContentType())
                .coverImageUrl(request.getCoverImageUrl())
                .status(Story.Status.DRAFT)
                .moderationStatus(Story.ModerationStatus.PENDING)
                .tags(request.getTags() != null ? request.getTags() : new ArrayList<>())
                .build();

        story = storyRepository.save(story);
        log.info("Story created successfully with ID: {}", story.getId());

        // Publish event for search indexing
        eventPublisher.publishEvent(new SearchIndexingService.StoryCreatedEvent(story));

        return convertToStoryResponse(story);
    }

    @Override
    @Transactional(readOnly = true)
    public StoryResponse getStoryById(UUID storyId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        return convertToStoryResponse(story);
    }

    @Override
    public StoryResponse updateStory(UUID storyId, UpdateStoryRequest request, UUID authorId) {
        log.info("Updating story: {} by author: {}", storyId, authorId);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        // Check if user is the author
        if (!story.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Not authorized to update this story");
        }

        // Update fields if provided
        if (request.getTitle() != null) {
            story.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            story.setDescription(request.getDescription());
        }
        if (request.getCoverImageUrl() != null) {
            story.setCoverImageUrl(request.getCoverImageUrl());
        }
        if (request.getContentType() != null) {
            story.setContentType(request.getContentType());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            story.setCategory(category);
        }
        if (request.getTags() != null) {
            story.setTags(request.getTags());
        }

        story = storyRepository.save(story);
        log.info("Story updated successfully: {}", storyId);

        // Publish event for search indexing
        eventPublisher.publishEvent(new SearchIndexingService.StoryUpdatedEvent(story));

        return convertToStoryResponse(story);
    }

    @Override
    public void deleteStory(UUID storyId, UUID authorId) {
        log.info("Deleting story: {} by author: {}", storyId, authorId);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        // Check if user is the author
        if (!story.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Not authorized to delete this story");
        }

        storyRepository.delete(story);
        log.info("Story deleted successfully: {}", storyId);

        // Publish event for search indexing
        eventPublisher.publishEvent(new SearchIndexingService.StoryDeletedEvent(storyId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoryPreviewResponse> getPublishedStories(int page, int size, String sortBy) {
        Sort sort = createSort(sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Story> stories = storyRepository.findByStatusOrderByCreatedAtDesc(
                Story.Status.PUBLISHED, pageable);

        return stories.map(this::convertToStoryPreviewResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoryPreviewResponse> getStoriesByAuthor(UUID authorId, int page, int size) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Author not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Story> stories = storyRepository.findByAuthor(author, pageable);

        return stories.map(this::convertToStoryPreviewResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoryPreviewResponse> getStoriesByCategory(UUID categoryId, int page, int size) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Story> stories = storyRepository.findByCategoryAndStatus(
                category, Story.Status.PUBLISHED, pageable);

        return stories.map(this::convertToStoryPreviewResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoryPreviewResponse> getMyStories(UUID authorId, int page, int size) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Author not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        Page<Story> stories = storyRepository.findByAuthor(author, pageable);

        return stories.map(this::convertToStoryPreviewResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoryPreviewResponse> searchStories(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Story> stories = storyRepository.searchByTitleOrDescription(
                query, Story.Status.PUBLISHED, pageable);

        return stories.map(this::convertToStoryPreviewResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoryPreviewResponse> getTrendingStories(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Story> stories = storyRepository.findTrendingStories(Story.Status.PUBLISHED, pageable);

        return stories.map(this::convertToStoryPreviewResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoryPreviewResponse> getFeaturedStories(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Story> stories = storyRepository.findByIsFeaturedTrueAndStatus(
                Story.Status.PUBLISHED, pageable);

        return stories.map(this::convertToStoryPreviewResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoryPreviewResponse> getStoriesWithFilters(
            String status, UUID categoryId, String contentType, UUID authorId,
            String sortBy, int page, int size) {

        Story.Status statusEnum = status != null ? Story.Status.valueOf(status) : null;
        Story.ContentType contentTypeEnum = contentType != null ? Story.ContentType.valueOf(contentType) : null;
        Sort sort = createSort(sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Story> stories = storyRepository.findStoriesWithFilters(
                statusEnum, categoryId, contentTypeEnum, authorId, pageable);

        return stories.map(this::convertToStoryPreviewResponse);
    }

    @Override
    public StoryResponse publishStory(UUID storyId, UUID authorId) {
        log.info("Publishing story: {} by author: {}", storyId, authorId);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        if (!story.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Not authorized to publish this story");
        }

        story.setStatus(Story.Status.PUBLISHED);
        story.setPublishedAt(LocalDateTime.now());
        story = storyRepository.save(story);

        log.info("Story published successfully: {}", storyId);

        // Publish event for search indexing
        eventPublisher.publishEvent(new SearchIndexingService.StoryUpdatedEvent(story));

        return convertToStoryResponse(story);
    }

    @Override
    public StoryResponse unpublishStory(UUID storyId, UUID authorId) {
        log.info("Unpublishing story: {} by author: {}", storyId, authorId);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        if (!story.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Not authorized to unpublish this story");
        }

        story.setStatus(Story.Status.DRAFT);
        story = storyRepository.save(story);

        log.info("Story unpublished successfully: {}", storyId);

        // Publish event for search indexing
        eventPublisher.publishEvent(new SearchIndexingService.StoryUpdatedEvent(story));

        return convertToStoryResponse(story);
    }

    @Override
    public void incrementViews(UUID storyId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        story.incrementViews();
        storyRepository.save(story);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isStoryOwner(UUID storyId, UUID userId) {
        return storyRepository.findById(storyId)
                .map(story -> story.getAuthor().getId().equals(userId))
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUserAccessStory(UUID storyId, UUID userId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        // Published stories are accessible to all
        if (story.getStatus() == Story.Status.PUBLISHED) {
            return true;
        }

        // Authors can access their own stories regardless of status
        return story.getAuthor().getId().equals(userId);
    }

    // Helper methods
    private Sort createSort(String sortBy) {
        if (sortBy == null) {
            return Sort.by("createdAt").descending();
        }

        return switch (sortBy.toLowerCase()) {
            case "popular" -> Sort.by("totalLikes").descending().and(Sort.by("createdAt").descending());
            case "trending" -> Sort.by("totalViews").descending().and(Sort.by("createdAt").descending());
            case "newest" -> Sort.by("createdAt").descending();
            case "oldest" -> Sort.by("createdAt").ascending();
            case "updated" -> Sort.by("updatedAt").descending();
            default -> Sort.by("createdAt").descending();
        };
    }

    private StoryResponse convertToStoryResponse(Story story) {
        return StoryResponse.builder()
                .id(story.getId())
                .title(story.getTitle())
                .description(story.getDescription())
                .coverImageUrl(story.getCoverImageUrl())
                .author(StoryResponse.AuthorInfo.builder()
                        .id(story.getAuthor().getId())
                        .username(story.getAuthor().getUsername())
                        .displayName(story.getAuthor().getDisplayName())
                        .profileImageUrl(story.getAuthor().getProfileImageUrl())
                        .build())
                .category(story.getCategory() != null ? StoryResponse.CategoryInfo.builder()
                        .id(story.getCategory().getId())
                        .name(story.getCategory().getName())
                        .slug(story.getCategory().getSlug())
                        .build() : null)
                .status(story.getStatus())
                .contentType(story.getContentType())
                .moderationStatus(story.getModerationStatus())
                .totalChapters(story.getTotalChapters())
                .totalViews(story.getTotalViews())
                .totalLikes(story.getTotalLikes())
                .totalComments(story.getTotalComments())
                .totalCoinsEarned(story.getTotalCoinsEarned())
                .isFeatured(story.getIsFeatured())
                .tags(story.getTags() != null ? story.getTags() : new ArrayList<>())
                .createdAt(story.getCreatedAt())
                .updatedAt(story.getUpdatedAt())
                .publishedAt(story.getPublishedAt())
                .build();
    }

    private StoryPreviewResponse convertToStoryPreviewResponse(Story story) {
        return StoryPreviewResponse.builder()
                .id(story.getId())
                .title(story.getTitle())
                .description(story.getDescription())
                .coverImageUrl(story.getCoverImageUrl())
                .author(StoryPreviewResponse.AuthorInfo.builder()
                        .id(story.getAuthor().getId())
                        .username(story.getAuthor().getUsername())
                        .displayName(story.getAuthor().getDisplayName())
                        .build())
                .category(story.getCategory() != null ? StoryPreviewResponse.CategoryInfo.builder()
                        .id(story.getCategory().getId())
                        .name(story.getCategory().getName())
                        .slug(story.getCategory().getSlug())
                        .build() : null)
                .status(story.getStatus())
                .contentType(story.getContentType())
                .totalChapters(story.getTotalChapters())
                .totalViews(story.getTotalViews())
                .totalLikes(story.getTotalLikes())
                .isFeatured(story.getIsFeatured())
                .tags(story.getTags() != null ? story.getTags() : new ArrayList<>())
                .createdAt(story.getCreatedAt())
                .publishedAt(story.getPublishedAt())
                .build();
    }
}