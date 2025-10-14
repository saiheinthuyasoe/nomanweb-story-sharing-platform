package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.FeaturedContent;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.FeaturedContentRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

    @Autowired
    private AutomaticBookSelectionService automaticBookSelectionService;

    @Cacheable(value = "homepage-sections", key = "#sectionType + '_' + #page + '_' + #size", 
               condition = "#result != null and !#result.isEmpty()")
    public Page<Story> getStoriesForSection(FeaturedContent.SectionType sectionType, int page, int size) {
        // Get manually curated content first
        List<FeaturedContent> featuredContent = featuredContentRepository.findActiveBySectionType(sectionType, LocalDateTime.now());
        
        if (!featuredContent.isEmpty()) {
            // Convert to stories and apply pagination manually
            List<Story> stories = featuredContent.stream()
                    .map(FeaturedContent::getStory)
                    .collect(Collectors.toList());
            
            // Apply pagination
            int start = page * size;
            int end = Math.min(start + size, stories.size());
            
            if (start >= stories.size()) {
                return new PageImpl<>(Collections.emptyList(), PageRequest.of(page, size), stories.size());
            }
            
            List<Story> pageContent = stories.subList(start, end);
            return new PageImpl<>(pageContent, PageRequest.of(page, size), stories.size());
        }
        
        // Fallback to automatic selection if no manual curation
        return automaticBookSelectionService.getStoriesBySection(sectionType.name(), page, size);
    }

    // Bulk method to fetch all homepage sections in a single database call
    @Cacheable(value = "homepage-sections", key = "'all_sections_' + #page + '_' + #size")
    public Map<FeaturedContent.SectionType, Page<Story>> getAllHomepageSections(int page, int size) {
        // Fetch all active featured content in a single query
        List<FeaturedContent> allFeaturedContent = featuredContentRepository.findAllActiveHomepageContent(LocalDateTime.now());
        
        // Group by section type
        Map<FeaturedContent.SectionType, List<FeaturedContent>> groupedContent = allFeaturedContent.stream()
                .collect(Collectors.groupingBy(FeaturedContent::getSectionType));
        
        Map<FeaturedContent.SectionType, Page<Story>> result = new HashMap<>();
        
        // Process each section
        for (FeaturedContent.SectionType sectionType : FeaturedContent.SectionType.values()) {
            List<FeaturedContent> sectionContent = groupedContent.getOrDefault(sectionType, Collections.emptyList());
            
            if (!sectionContent.isEmpty()) {
                // Convert to stories and apply pagination
                List<Story> stories = sectionContent.stream()
                        .map(FeaturedContent::getStory)
                        .collect(Collectors.toList());
                
                // Apply pagination
                int start = page * size;
                int end = Math.min(start + size, stories.size());
                
                if (start >= stories.size()) {
                    result.put(sectionType, new PageImpl<>(Collections.emptyList(), PageRequest.of(page, size), stories.size()));
                } else {
                    List<Story> pageContent = stories.subList(start, end);
                    result.put(sectionType, new PageImpl<>(pageContent, PageRequest.of(page, size), stories.size()));
                }
            } else {
                // Fallback to automatic selection
                result.put(sectionType, automaticBookSelectionService.getStoriesBySection(sectionType.name(), page, size));
            }
        }
        
        return result;
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

    @CacheEvict(value = "homepage-sections", allEntries = true)
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

    @CacheEvict(value = "homepage-sections", allEntries = true)
    public void removeFromFeaturedSection(UUID featuredContentId) {
        Optional<FeaturedContent> featuredOpt = featuredContentRepository.findById(featuredContentId);
        if (!featuredOpt.isPresent()) {
            throw new RuntimeException("Featured content not found");
        }

        // Actually delete the record from database
        featuredContentRepository.deleteById(featuredContentId);
    }

    @CacheEvict(value = "homepage-sections", allEntries = true)
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