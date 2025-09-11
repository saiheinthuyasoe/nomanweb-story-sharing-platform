package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.FeaturedContent;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.FeaturedContentRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageImpl;

@Service
@Transactional
public class FeaturedContentService {

    @Autowired
    private FeaturedContentRepository featuredContentRepository;

    @Autowired
    private StoryRepository storyRepository;

    // Get stories for homepage sections - now uses admin-curated featured content
    public Page<Story> getStoriesForSection(FeaturedContent.SectionType sectionType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        // Get active featured content for this section
        Page<FeaturedContent> featuredContent = featuredContentRepository.findActiveBySectionType(
                sectionType, LocalDateTime.now(), pageable);

        // Extract stories from featured content
        List<Story> stories = featuredContent.getContent().stream()
                .map(FeaturedContent::getStory)
                .collect(Collectors.toList());

        // Return as Page with proper pagination info
        return new PageImpl<>(stories, pageable, featuredContent.getTotalElements());
    }

    // Admin methods for managing featured content
    public Page<FeaturedContent> getActiveFeaturedContent(FeaturedContent.SectionType sectionType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return featuredContentRepository.findActiveBySectionType(sectionType, LocalDateTime.now(), pageable);
    }

    public Page<FeaturedContent> getAllFeaturedContent(FeaturedContent.SectionType sectionType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return featuredContentRepository.findBySectionTypeOrderByDisplayOrderAscCreatedAtDesc(sectionType, pageable);
    }

    public FeaturedContent addToFeaturedSection(UUID storyId, FeaturedContent.SectionType sectionType, User admin,
            Integer duration) {
        Optional<Story> storyOpt = storyRepository.findById(storyId);
        if (!storyOpt.isPresent()) {
            throw new RuntimeException("Story not found");
        }

        Story story = storyOpt.get();

        // Check if story is already featured in this section
        boolean alreadyFeatured = featuredContentRepository.existsByStoryAndSectionTypeAndIsActive(story,
                sectionType, true);
        if (alreadyFeatured) {
            throw new RuntimeException("Story is already featured in this section");
        }

        // Get next display order
        Integer nextOrder = featuredContentRepository.getNextDisplayOrder(sectionType);

        FeaturedContent featuredContent = new FeaturedContent();
        featuredContent.setStory(story);
        featuredContent.setSectionType(sectionType);
        featuredContent.setDisplayOrder(nextOrder != null ? nextOrder : 1);
        featuredContent.setIsActive(true);
        featuredContent.setStartDate(LocalDateTime.now());

        // Set endDate only for WEEKLY_FEATURES section and when duration > 0
        if (sectionType == FeaturedContent.SectionType.WEEKLY_FEATURES && duration != null && duration > 0) {
            featuredContent.setEndDate(LocalDateTime.now().plusDays(duration));
        }
        // For other sections or duration = 0, endDate remains null (permanent)

        featuredContent.setCreatedBy(admin);
        featuredContent.setCreatedAt(LocalDateTime.now());
        featuredContent.setUpdatedAt(LocalDateTime.now());

        return featuredContentRepository.save(featuredContent);
    }

    public void removeFromFeaturedSection(UUID featuredContentId) {
        Optional<FeaturedContent> featuredOpt = featuredContentRepository.findById(featuredContentId);
        if (!featuredOpt.isPresent()) {
            throw new RuntimeException("Featured content not found");
        }

        // Actually delete the record from database
        featuredContentRepository.deleteById(featuredContentId);
    }

    public void updateDisplayOrder(UUID featuredContentId, Integer newOrder) {
        Optional<FeaturedContent> featuredOpt = featuredContentRepository.findById(featuredContentId);
        if (!featuredOpt.isPresent()) {
            throw new RuntimeException("Featured content not found");
        }

        FeaturedContent featured = featuredOpt.get();
        featured.setDisplayOrder(newOrder);
        featured.setUpdatedAt(LocalDateTime.now());

        featuredContentRepository.save(featured);
    }

    public void setFeaturedDuration(UUID featuredContentId, LocalDateTime startDate, LocalDateTime endDate) {
        Optional<FeaturedContent> featuredOpt = featuredContentRepository.findById(featuredContentId);
        if (!featuredOpt.isPresent()) {
            throw new RuntimeException("Featured content not found");
        }

        FeaturedContent featured = featuredOpt.get();
        featured.setStartDate(startDate);
        featured.setEndDate(endDate);
        featured.setUpdatedAt(LocalDateTime.now());

        featuredContentRepository.save(featured);
    }

    // Utility methods
    public long getActiveFeaturedCount(FeaturedContent.SectionType sectionType) {
        return featuredContentRepository.countActiveBySectionType(sectionType, LocalDateTime.now());
    }

    public List<FeaturedContent> getExpiredFeaturedContent() {
        return featuredContentRepository.findExpiredContent(LocalDateTime.now());
    }

    public void deactivateExpiredContent() {
        List<FeaturedContent> expiredContent = getExpiredFeaturedContent();
        for (FeaturedContent content : expiredContent) {
            content.setIsActive(false);
            content.setUpdatedAt(LocalDateTime.now());
        }
        featuredContentRepository.saveAll(expiredContent);
    }

    public FeaturedContent toggleActiveStatus(UUID featuredContentId) {
        Optional<FeaturedContent> featuredOpt = featuredContentRepository.findById(featuredContentId);
        if (!featuredOpt.isPresent()) {
            throw new RuntimeException("Featured content not found");
        }

        FeaturedContent featured = featuredOpt.get();
        featured.setIsActive(!featured.getIsActive());
        featured.setUpdatedAt(LocalDateTime.now());

        return featuredContentRepository.save(featured);
    }

    // Get stories by category for genre sections
    public Page<Story> getStoriesByCategory(UUID categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return storyRepository.findByCategoryIdAndPublishStatus(categoryId, Story.PublishStatus.PUBLISHED, pageable);
    }

    // Toggle story featured status
    public void toggleStoryFeaturedStatus(UUID storyId) {
        Optional<Story> storyOpt = storyRepository.findById(storyId);
        if (!storyOpt.isPresent()) {
            throw new RuntimeException("Story not found");
        }

        Story story = storyOpt.get();
        story.setIsFeatured(!story.getIsFeatured());
        story.setUpdatedAt(LocalDateTime.now());

        storyRepository.save(story);
    }
}