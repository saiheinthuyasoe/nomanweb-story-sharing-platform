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
import java.util.stream.Collectors;
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
                .pricingType(request.getPricingType())
                .bookStatus(request.getBookStatus())
                .coverImageUrl(request.getCoverImageUrl())
                .bookPrice(request.getBookPrice())
                .defaultChapterPrice(request.getDefaultChapterPrice())
                .publishStatus(Story.PublishStatus.DRAFT)
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
        if (request.getPricingType() != null) {
            story.setPricingType(request.getPricingType());
        }
        if (request.getBookStatus() != null) {
            story.setBookStatus(request.getBookStatus());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            story.setCategory(category);
        }
        if (request.getTags() != null) {
            story.setTags(request.getTags());
        }
        if (request.getBookPrice() != null) {
            story.setBookPrice(request.getBookPrice());
        }
        if (request.getDefaultChapterPrice() != null) {
            story.setDefaultChapterPrice(request.getDefaultChapterPrice());
        }

        story = storyRepository.save(story);
        log.info("Story updated successfully: {}", storyId);

        // Publish event for search indexing
        eventPublisher.publishEvent(new SearchIndexingService.StoryUpdatedEvent(story));

        return convertToStoryResponse(story);
    }

    @Override
    public void deleteStory(UUID storyId, UUID authorId) {
        // This method now performs soft delete by moving to trash
        moveStoryToTrash(storyId, authorId);
    }

    @Override
    public void moveStoryToTrash(UUID storyId, UUID authorId) {
        log.info("🔄 Moving story to trash: {} by author: {}", storyId, authorId);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        log.info("📖 Found story: {} - current isDeleted: {}, deletedAt: {}",
                storyId, story.isInTrash(), story.getDeletedAt());

        // Check if user is the author
        if (!story.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Not authorized to delete this story");
        }

        // Move to trash
        story.moveToTrash();
        log.info("🗑️ Called moveToTrash() - isDeleted: {}, deletedAt: {}",
                story.isInTrash(), story.getDeletedAt());

        Story savedStory = storyRepository.save(story);

        // Debug logging to confirm the save
        log.info("✅ Story moved to trash successfully: {} - isDeleted: {}, deletedAt: {}",
                storyId, savedStory.isInTrash(), savedStory.getDeletedAt());

        // Double-check by fetching from database
        Story verifyStory = storyRepository.findById(storyId).orElse(null);
        if (verifyStory != null) {
            log.info("🔍 Verification - Story from DB: {} - isDeleted: {}, deletedAt: {}",
                    storyId, verifyStory.isInTrash(), verifyStory.getDeletedAt());
        } else {
            log.error("❌ Verification failed - Story not found in DB: {}", storyId);
        }
    }

    @Override
    public void restoreStoryFromTrash(UUID storyId, UUID authorId) {
        log.info("Restoring story from trash: {} by author: {}", storyId, authorId);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        // Check if user is the author
        if (!story.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Not authorized to restore this story");
        }

        if (!story.isInTrash()) {
            throw new RuntimeException("Story is not in trash");
        }

        // Restore from trash
        story.restoreFromTrash();
        storyRepository.save(story);

        log.info("Story restored from trash: {}", storyId);
    }

    @Override
    public void permanentlyDeleteStory(UUID storyId, UUID authorId) {
        log.info("🗑️ Permanently deleting story: {} by author: {}", storyId, authorId);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        // Check if user is the author
        if (!story.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Not authorized to permanently delete this story");
        }

        if (!story.isInTrash()) {
            throw new RuntimeException("Story must be in trash before permanent deletion");
        }

        // Log related entities that will be cascade deleted
        log.info(
                "📚 Story '{}' has {} chapters, {} comments, {} reading progress, {} reading lists, {} gift transactions, {} chapter purchases that will be cascade deleted",
                story.getTitle(),
                story.getChapters().size(),
                story.getComments().size(),
                story.getReadingProgress().size(),
                story.getReadingLists().size(),
                story.getGiftTransactions().size(),
                story.getChapterPurchases().size());

        // Permanently delete (this will cascade delete all related entities)
        storyRepository.delete(story);
        log.info("✅ Story and all related entities permanently deleted: {}", storyId);

        // Publish event for search indexing
        eventPublisher.publishEvent(new SearchIndexingService.StoryDeletedEvent(storyId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<StoryPreviewResponse> getTrashByAuthor(UUID authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Author not found"));

        List<Story> trashStories = storyRepository.findTrashByAuthor(author);
        return trashStories.stream()
                .map(this::convertToStoryPreviewResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void bulkMoveToTrash(List<UUID> storyIds, UUID authorId) {
        log.info("Bulk moving {} stories to trash for author: {}", storyIds.size(), authorId);

        if (storyIds.isEmpty()) {
            return;
        }

        // Fetch all stories and validate ownership
        List<Story> stories = storyRepository.findAllById(storyIds);

        if (stories.size() != storyIds.size()) {
            throw new RuntimeException("Some stories were not found");
        }

        // Validate that all stories belong to the same author
        for (Story story : stories) {
            if (!story.getAuthor().getId().equals(authorId)) {
                throw new RuntimeException("Only the author can delete stories");
            }
        }

        // Move stories to trash
        for (Story story : stories) {
            story.moveToTrash();
        }
        storyRepository.saveAll(stories);

        log.info("Bulk move to trash completed successfully for {} stories", storyIds.size());
    }

    @Override
    public void bulkRestoreFromTrash(List<UUID> storyIds, UUID authorId) {
        log.info("Bulk restoring {} stories from trash for author: {}", storyIds.size(), authorId);

        if (storyIds.isEmpty()) {
            return;
        }

        // Fetch all stories and validate ownership
        List<Story> stories = storyRepository.findAllById(storyIds);

        if (stories.size() != storyIds.size()) {
            throw new RuntimeException("Some stories were not found");
        }

        // Validate that all stories belong to the same author and are in trash
        for (Story story : stories) {
            if (!story.getAuthor().getId().equals(authorId)) {
                throw new RuntimeException("Only the author can restore stories");
            }
            if (!story.isInTrash()) {
                throw new RuntimeException("Story is not in trash: " + story.getId());
            }
        }

        // Restore stories
        for (Story story : stories) {
            story.restoreFromTrash();
        }
        storyRepository.saveAll(stories);

        log.info("Bulk restore from trash completed successfully for {} stories", storyIds.size());
    }

    @Override
    public void bulkPermanentlyDelete(List<UUID> storyIds, UUID authorId) {
        log.info("🗑️ Permanently deleting {} stories for author: {}", storyIds.size(), authorId);

        if (storyIds.isEmpty()) {
            return;
        }

        // Fetch all stories and validate ownership
        List<Story> stories = storyRepository.findAllById(storyIds);

        if (stories.size() != storyIds.size()) {
            throw new RuntimeException("Some stories were not found");
        }

        // Validate that all stories belong to the same author and are in trash
        for (Story story : stories) {
            if (!story.getAuthor().getId().equals(authorId)) {
                throw new RuntimeException("Only the author can permanently delete stories");
            }
            if (!story.isInTrash()) {
                throw new RuntimeException("Story must be in trash before permanent deletion: " + story.getId());
            }
        }

        // Log total related entities that will be cascade deleted
        int totalChapters = stories.stream().mapToInt(s -> s.getChapters().size()).sum();
        int totalComments = stories.stream().mapToInt(s -> s.getComments().size()).sum();
        int totalReadingProgress = stories.stream().mapToInt(s -> s.getReadingProgress().size()).sum();
        int totalReadingLists = stories.stream().mapToInt(s -> s.getReadingLists().size()).sum();
        int totalGiftTransactions = stories.stream().mapToInt(s -> s.getGiftTransactions().size()).sum();
        int totalChapterPurchases = stories.stream().mapToInt(s -> s.getChapterPurchases().size()).sum();

        log.info(
                "📚 Bulk deleting {} stories with {} chapters, {} comments, {} reading progress, {} reading lists, {} gift transactions, {} chapter purchases",
                stories.size(), totalChapters, totalComments, totalReadingProgress, totalReadingLists,
                totalGiftTransactions, totalChapterPurchases);

        // Permanently delete all stories (this will cascade delete all related
        // entities)
        storyRepository.deleteAll(stories);

        log.info("✅ Permanently deleted {} stories and all their related entities", storyIds.size());
    }

    @Override
    public void emptyTrash(UUID authorId) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Author not found"));

        List<Story> trashStories = storyRepository.findTrashByAuthor(author);

        if (trashStories.isEmpty()) {
            log.info("🗑️ No stories in trash for author: {}", authorId);
            return;
        }

        // Log total related entities that will be cascade deleted
        int totalChapters = trashStories.stream().mapToInt(s -> s.getChapters().size()).sum();
        int totalComments = trashStories.stream().mapToInt(s -> s.getComments().size()).sum();
        int totalReadingProgress = trashStories.stream().mapToInt(s -> s.getReadingProgress().size()).sum();
        int totalReadingLists = trashStories.stream().mapToInt(s -> s.getReadingLists().size()).sum();
        int totalGiftTransactions = trashStories.stream().mapToInt(s -> s.getGiftTransactions().size()).sum();
        int totalChapterPurchases = trashStories.stream().mapToInt(s -> s.getChapterPurchases().size()).sum();

        log.info(
                "🗑️ Emptying trash: {} stories with {} chapters, {} comments, {} reading progress, {} reading lists, {} gift transactions, {} chapter purchases",
                trashStories.size(), totalChapters, totalComments, totalReadingProgress, totalReadingLists,
                totalGiftTransactions, totalChapterPurchases);

        // Permanently delete all stories in trash (this will cascade delete all related
        // entities)
        storyRepository.deleteAll(trashStories);

        log.info("✅ Emptied trash: permanently deleted {} stories and all their related entities from author: {}",
                trashStories.size(), authorId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoryPreviewResponse> getPublishedStories(int page, int size, String sortBy) {
        Sort sort = createSort(sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Story> stories = storyRepository.findByPublishStatusOrderByCreatedAtDesc(
                Story.PublishStatus.PUBLISHED, pageable);

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
        Page<Story> stories = storyRepository.findByCategoryAndPublishStatus(
                category, Story.PublishStatus.PUBLISHED, pageable);

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
    public Page<StoryPreviewResponse> getMyStoriesIncludingDeleted(UUID authorId, int page, int size) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Author not found"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        Page<Story> stories = storyRepository.findAllByAuthorIncludingDeleted(author, pageable);

        // Debug logging
        log.info("📚 Fetched stories including deleted for author {}: total={}, deleted={}",
                authorId,
                stories.getTotalElements(),
                stories.getContent().stream().filter(Story::isInTrash).count());

        // Log each story's deletion status
        stories.getContent().forEach(story -> {
            log.info("📖 Story: {} - isDeleted: {}, deletedAt: {}",
                    story.getId(), story.isInTrash(), story.getDeletedAt());
        });

        return stories.map(this::convertToStoryPreviewResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoryPreviewResponse> searchStories(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Story> stories = storyRepository.searchByTitleOrDescription(
                query, Story.PublishStatus.PUBLISHED, pageable);

        return stories.map(this::convertToStoryPreviewResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoryPreviewResponse> getTrendingStories(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Story> stories = storyRepository.findTrendingStories(Story.PublishStatus.PUBLISHED, pageable);

        return stories.map(this::convertToStoryPreviewResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoryPreviewResponse> getFeaturedStories(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Story> stories = storyRepository.findByIsFeaturedTrueAndPublishStatus(
                Story.PublishStatus.PUBLISHED, pageable);

        return stories.map(this::convertToStoryPreviewResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StoryPreviewResponse> getStoriesWithFilters(
            String publishStatus, UUID categoryId, String pricingType, String bookStatus, UUID authorId,
            String sortBy, int page, int size) {

        Story.PublishStatus publishStatusEnum = publishStatus != null ? Story.PublishStatus.valueOf(publishStatus)
                : null;
        Story.PricingType pricingTypeEnum = pricingType != null ? Story.PricingType.valueOf(pricingType) : null;
        Story.BookStatus bookStatusEnum = bookStatus != null ? Story.BookStatus.valueOf(bookStatus)
                : null;
        Sort sort = createSort(sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Story> stories = storyRepository.findStoriesWithFilters(
                publishStatusEnum, categoryId, pricingTypeEnum, bookStatusEnum, authorId, pageable);

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

        story.setPublishStatus(Story.PublishStatus.PUBLISHED);
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

        story.setPublishStatus(Story.PublishStatus.DRAFT);
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
        if (story.getPublishStatus() == Story.PublishStatus.PUBLISHED) {
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
                .publishStatus(story.getPublishStatus())
                .pricingType(story.getPricingType())
                .bookStatus(story.getBookStatus())
                .moderationStatus(story.getModerationStatus())
                .totalChapters(story.getTotalChapters())
                .totalViews(story.getTotalViews())
                .totalLikes(story.getTotalLikes())
                .totalComments(story.getTotalComments())
                .totalCoinsEarned(story.getTotalCoinsEarned())
                .bookPrice(story.getBookPrice())
                .defaultChapterPrice(story.getDefaultChapterPrice())
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
                .publishStatus(story.getPublishStatus())
                .pricingType(story.getPricingType())
                .bookStatus(story.getBookStatus())
                .moderationStatus(story.getModerationStatus())
                .totalChapters(story.getTotalChapters())
                .totalViews(story.getTotalViews())
                .totalLikes(story.getTotalLikes())
                .isFeatured(story.getIsFeatured())
                .tags(story.getTags() != null ? story.getTags() : new ArrayList<>())
                .createdAt(story.getCreatedAt())
                .publishedAt(story.getPublishedAt())
                .isDeleted(story.isInTrash())
                .deletedAt(story.getDeletedAt())
                .build();
    }
}