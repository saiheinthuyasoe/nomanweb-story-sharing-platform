package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.chapter.*;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.repository.ChapterRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.repository.CoinTransactionRepository;
import com.app.nomanweb_backend.service.ChapterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageImpl;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChapterServiceImpl implements ChapterService {

    private final ChapterRepository chapterRepository;
    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final CoinTransactionRepository coinTransactionRepository;

    private static final int WORDS_PER_MINUTE = 200; // Average reading speed

    @Override
    public ChapterResponse createChapter(CreateChapterRequest request, UUID authorId) {
        log.info("Creating chapter for story: {} by author: {}", request.getStoryId(), authorId);

        // Validate story and author
        Story story = storyRepository.findById(request.getStoryId())
                .orElseThrow(() -> new IllegalArgumentException("Story not found"));

        if (!story.getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("Only the story author can create chapters");
        }

        // Auto-assign chapter number if not provided
        Integer chapterNumber = request.getChapterNumber();
        if (chapterNumber == null) {
            chapterNumber = chapterRepository.findMaxChapterNumberByStory(story)
                    .orElse(0) + 1;
        }

        // Validate chapter number doesn't exist
        if (chapterRepository.existsByStoryAndChapterNumber(story, chapterNumber)) {
            throw new IllegalArgumentException("Chapter number " + chapterNumber + " already exists");
        }

        // Create chapter
        Chapter chapter = Chapter.builder()
                .story(story)
                .chapterNumber(chapterNumber)
                .title(request.getTitle())
                .content(request.getContent())
                .coinPrice(request.getCoinPrice())
                .isFree(request.getIsFree())
                .status(request.getIsDraft() ? Chapter.Status.DRAFT : Chapter.Status.PUBLISHED)
                .moderationStatus(Chapter.ModerationStatus.PENDING)
                .build();

        // Calculate word count
        chapter.updateWordCount();

        // Set published date if publishing
        if (!request.getIsDraft()) {
            chapter.setPublishedAt(LocalDateTime.now());
        }

        chapter = chapterRepository.save(chapter);

        // Update story chapter count
        story.setTotalChapters(story.getTotalChapters() + 1);
        storyRepository.save(story);

        log.info("Chapter created successfully: {}", chapter.getId());
        return mapToChapterResponse(chapter, authorId);
    }

    @Override
    @Transactional(readOnly = true)
    public ChapterResponse getChapterById(UUID chapterId, UUID currentUserId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        // Check access permissions
        if (!canUserAccessChapter(chapterId, currentUserId)) {
            throw new IllegalArgumentException("Access denied to this chapter");
        }

        return mapToChapterResponse(chapter, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public ChapterResponse getChapterByStoryAndNumber(UUID storyId, Integer chapterNumber, UUID currentUserId) {
        log.info("Getting chapter by story: {} and chapter number: {}, user: {}", storyId, chapterNumber,
                currentUserId);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new IllegalArgumentException("Story not found"));
        log.info("Story found: {}", story.getTitle());

        Chapter chapter = chapterRepository.findByStoryAndChapterNumber(story, chapterNumber)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));
        log.info("Chapter found: {} - {}", chapter.getId(), chapter.getTitle());

        // Check access permissions
        if (!canUserAccessChapter(chapter.getId(), currentUserId)) {
            log.error("Access denied to chapter: {} for user: {}", chapter.getId(), currentUserId);
            throw new IllegalArgumentException("Access denied to this chapter");
        }

        log.info("Access granted, returning chapter response");
        return mapToChapterResponse(chapter, currentUserId);
    }

    @Override
    public ChapterResponse updateChapter(UUID chapterId, UpdateChapterRequest request, UUID authorId) {
        log.info("Starting updateChapter for chapterId: {}, authorId: {}", chapterId, authorId);
        log.info(
                "Request data: title={}, content length={}, coinPrice={}, isFree={}, chapterNumber={}, shouldPublish={}",
                request.getTitle(),
                request.getContent() != null ? request.getContent().length() : 0,
                request.getCoinPrice(),
                request.getIsFree(),
                request.getChapterNumber(),
                request.getShouldPublish());

        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        // Validate ownership
        if (!chapter.getStory().getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("Only the author can update this chapter");
        }

        log.info(
                "Current chapter data: title={}, content length={}, coinPrice={}, isFree={}, chapterNumber={}, status={}",
                chapter.getTitle(),
                chapter.getContent() != null ? chapter.getContent().length() : 0,
                chapter.getCoinPrice(),
                chapter.getIsFree(),
                chapter.getChapterNumber(),
                chapter.getStatus());

        // Update fields
        if (request.getTitle() != null) {
            log.info("Updating title from '{}' to '{}'", chapter.getTitle(), request.getTitle());
            chapter.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            log.info("Updating content from length {} to length {}",
                    chapter.getContent() != null ? chapter.getContent().length() : 0,
                    request.getContent().length());
            chapter.setContent(request.getContent());
            chapter.updateWordCount();
        }
        if (request.getCoinPrice() != null) {
            chapter.setCoinPrice(request.getCoinPrice());
        }
        if (request.getIsFree() != null) {
            chapter.setIsFree(request.getIsFree());
        }
        if (request.getChapterNumber() != null && !request.getChapterNumber().equals(chapter.getChapterNumber())) {
            // Validate that the new chapter number doesn't already exist
            if (chapterRepository.existsByStoryAndChapterNumber(chapter.getStory(), request.getChapterNumber())) {
                throw new IllegalArgumentException(
                        "Chapter number " + request.getChapterNumber() + " already exists in this story");
            }
            log.info("Updating chapter number from {} to {}", chapter.getChapterNumber(), request.getChapterNumber());
            chapter.setChapterNumber(request.getChapterNumber());
        }

        // Handle publishing
        if (request.getShouldPublish() != null) {
            if (request.getShouldPublish() && chapter.getStatus() == Chapter.Status.DRAFT) {
                chapter.setStatus(Chapter.Status.PUBLISHED);
                chapter.setPublishedAt(LocalDateTime.now());
            } else if (!request.getShouldPublish() && chapter.getStatus() == Chapter.Status.PUBLISHED) {
                chapter.setStatus(Chapter.Status.DRAFT);
                chapter.setPublishedAt(null);
            }
        }

        // Log the chapter state right before saving
        log.info("About to save chapter - Final state: id={}, title={}, contentLength={}, wordCount={}, status={}",
                chapter.getId(),
                chapter.getTitle(),
                chapter.getContent() != null ? chapter.getContent().length() : 0,
                chapter.getWordCount(),
                chapter.getStatus());

        // Force the entity to be dirty by setting updated timestamp
        chapter.setUpdatedAt(LocalDateTime.now());

        chapter = chapterRepository.save(chapter);

        // Log the saved chapter state
        log.info(
                "Chapter saved successfully - Saved state: id={}, title={}, contentLength={}, wordCount={}, status={}, updatedAt={}",
                chapter.getId(),
                chapter.getTitle(),
                chapter.getContent() != null ? chapter.getContent().length() : 0,
                chapter.getWordCount(),
                chapter.getStatus(),
                chapter.getUpdatedAt());

        // Flush the transaction to ensure database write
        chapterRepository.flush();
        log.info("Chapter transaction flushed to database: {}", chapterId);

        // Verify the save by re-reading from database
        Chapter verificationChapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found after save"));
        log.info("Database verification - Saved content length: {}, expected: {}",
                verificationChapter.getContent() != null ? verificationChapter.getContent().length() : 0,
                chapter.getContent() != null ? chapter.getContent().length() : 0);

        if (verificationChapter.getContent() != null && chapter.getContent() != null) {
            boolean contentMatches = verificationChapter.getContent().equals(chapter.getContent());
            log.info("Content verification: matches = {}", contentMatches);
            if (!contentMatches) {
                log.error("CRITICAL: Saved content does not match expected content!");
                log.error("Expected content (first 200 chars): {}",
                        chapter.getContent().substring(0, Math.min(200, chapter.getContent().length())));
                log.error("Actual DB content (first 200 chars): {}",
                        verificationChapter.getContent().substring(0,
                                Math.min(200, verificationChapter.getContent().length())));
            }
        }

        return mapToChapterResponse(chapter, authorId);
    }

    @Override
    public void deleteChapter(UUID chapterId, UUID authorId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        // Validate ownership
        if (!chapter.getStory().getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("Only the author can delete this chapter");
        }

        Story story = chapter.getStory();
        chapterRepository.delete(chapter);

        // Update story chapter count
        story.setTotalChapters(Math.max(0, story.getTotalChapters() - 1));
        storyRepository.save(story);

        log.info("Chapter deleted: {}", chapterId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChapterPreviewResponse> getChaptersByStory(UUID storyId, UUID currentUserId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new IllegalArgumentException("Story not found"));

        // Get published chapters or all chapters if user is the author
        List<Chapter> chapters;
        if (story.getAuthor().getId().equals(currentUserId)) {
            chapters = chapterRepository.findByStoryOrderByChapterNumberAsc(story);
        } else {
            chapters = chapterRepository.findByStoryAndStatusOrderByChapterNumberAsc(story, Chapter.Status.PUBLISHED);
        }

        return chapters.stream()
                .map(this::mapToChapterPreviewResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChapterPreviewResponse> getChaptersByStory(UUID storyId, UUID currentUserId, Pageable pageable) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new IllegalArgumentException("Story not found"));

        Page<Chapter> chapters = chapterRepository.findByStoryOrderByChapterNumberAsc(story, pageable);
        return chapters.map(this::mapToChapterPreviewResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ChapterResponse getNextChapter(UUID currentChapterId, UUID currentUserId) {
        Chapter currentChapter = chapterRepository.findById(currentChapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        Optional<Chapter> nextChapter = chapterRepository.findNextChapter(
                currentChapter.getStory(),
                currentChapter.getChapterNumber(),
                Chapter.Status.PUBLISHED);

        if (nextChapter.isEmpty()) {
            throw new IllegalArgumentException("No next chapter available");
        }

        if (!canUserAccessChapter(nextChapter.get().getId(), currentUserId)) {
            throw new IllegalArgumentException("Access denied to next chapter");
        }

        return mapToChapterResponse(nextChapter.get(), currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public ChapterResponse getPreviousChapter(UUID currentChapterId, UUID currentUserId) {
        Chapter currentChapter = chapterRepository.findById(currentChapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        Optional<Chapter> previousChapter = chapterRepository.findPreviousChapter(
                currentChapter.getStory(),
                currentChapter.getChapterNumber(),
                Chapter.Status.PUBLISHED);

        if (previousChapter.isEmpty()) {
            throw new IllegalArgumentException("No previous chapter available");
        }

        return mapToChapterResponse(previousChapter.get(), currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public ChapterResponse getFirstChapter(UUID storyId, UUID currentUserId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new IllegalArgumentException("Story not found"));

        Chapter firstChapter = chapterRepository
                .findFirstByStoryAndStatusOrderByChapterNumberAsc(story, Chapter.Status.PUBLISHED)
                .orElseThrow(() -> new IllegalArgumentException("No published chapters found"));

        if (!canUserAccessChapter(firstChapter.getId(), currentUserId)) {
            throw new IllegalArgumentException("Access denied to first chapter");
        }

        return mapToChapterResponse(firstChapter, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public ChapterResponse getLastChapter(UUID storyId, UUID currentUserId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new IllegalArgumentException("Story not found"));

        Chapter lastChapter = chapterRepository
                .findFirstByStoryAndStatusOrderByChapterNumberDesc(story, Chapter.Status.PUBLISHED)
                .orElseThrow(() -> new IllegalArgumentException("No published chapters found"));

        return mapToChapterResponse(lastChapter, currentUserId);
    }

    @Override
    public ChapterResponse publishChapter(UUID chapterId, UUID authorId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        if (!chapter.getStory().getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("Only the author can publish this chapter");
        }

        chapter.setStatus(Chapter.Status.PUBLISHED);
        chapter.setPublishedAt(LocalDateTime.now());
        chapter = chapterRepository.save(chapter);

        log.info("Chapter published: {}", chapterId);
        return mapToChapterResponse(chapter, authorId);
    }

    @Override
    public ChapterResponse unpublishChapter(UUID chapterId, UUID authorId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        if (!chapter.getStory().getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("Only the author can unpublish this chapter");
        }

        chapter.setStatus(Chapter.Status.DRAFT);
        chapter.setPublishedAt(null);
        chapter = chapterRepository.save(chapter);

        log.info("Chapter unpublished: {}", chapterId);
        return mapToChapterResponse(chapter, authorId);
    }

    @Override
    public void reorderChapters(UUID storyId, List<UUID> chapterIds, UUID authorId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new IllegalArgumentException("Story not found"));

        if (!story.getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("Only the author can reorder chapters");
        }

        for (int i = 0; i < chapterIds.size(); i++) {
            Chapter chapter = chapterRepository.findById(chapterIds.get(i))
                    .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

            if (!chapter.getStory().getId().equals(storyId)) {
                throw new IllegalArgumentException("Chapter does not belong to this story");
            }

            chapter.setChapterNumber(i + 1);
            chapterRepository.save(chapter);
        }

        log.info("Chapters reordered for story: {}", storyId);
    }

    @Override
    public void incrementChapterViews(UUID chapterId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        chapter.incrementViews();
        chapterRepository.save(chapter);

        // Also increment story views
        Story story = chapter.getStory();
        story.incrementViews();
        storyRepository.save(story);
    }

    @Override
    public void updateChapterWordCount(UUID chapterId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        chapter.updateWordCount();
        chapterRepository.save(chapter);
    }

    @Override
    public Integer calculateReadingTime(String content) {
        if (content == null || content.trim().isEmpty()) {
            return 0;
        }
        int wordCount = content.trim().split("\\s+").length;
        return Math.max(1, (int) Math.ceil((double) wordCount / WORDS_PER_MINUTE));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canUserAccessChapter(UUID chapterId, UUID userId) {
        log.info("Checking access for chapter: {}, user: {}", chapterId, userId);

        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        log.info("Chapter found - Status: {}, IsFree: {}, Author: {}",
                chapter.getStatus(), chapter.getIsFree(), chapter.getStory().getAuthor().getId());

        // Author can always access (if authenticated)
        if (userId != null && chapter.getStory().getAuthor().getId().equals(userId)) {
            log.info("Access granted - User is the author");
            return true;
        }

        // Chapter must be published for public access
        if (chapter.getStatus() != Chapter.Status.PUBLISHED) {
            log.info("Access denied - Chapter is not published");
            return false;
        }

        // Free published chapters are accessible to everyone (including anonymous
        // users)
        if (chapter.getIsFree()) {
            log.info("Access granted - Chapter is free and published");
            return true;
        }

        // For paid chapters, user must be authenticated and have purchased it
        if (userId == null) {
            log.info("Access denied - Chapter is paid and user is not authenticated");
            return false;
        }

        // Check if user has purchased the chapter
        boolean hasPurchased = hasUserPurchasedChapter(chapterId, userId);
        log.info("Access check for paid chapter - User has purchased: {}", hasPurchased);
        return hasPurchased;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUserPurchasedChapter(UUID chapterId, UUID userId) {
        // Check if user has a successful coin transaction for this chapter
        return coinTransactionRepository.existsByUserIdAndReferenceIdAndReferenceTypeAndTransactionTypeAndStatus(
                userId, chapterId, com.app.nomanweb_backend.entity.CoinTransaction.ReferenceType.CHAPTER,
                com.app.nomanweb_backend.entity.CoinTransaction.TransactionType.PURCHASE,
                com.app.nomanweb_backend.entity.CoinTransaction.Status.COMPLETED);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChapterPreviewResponse> getChaptersBetween(UUID storyId, Integer startChapter, Integer endChapter,
            UUID currentUserId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new IllegalArgumentException("Story not found"));

        List<Chapter> chapters = chapterRepository
                .findByStoryAndStatusOrderByChapterNumberAsc(story, Chapter.Status.PUBLISHED)
                .stream()
                .filter(c -> c.getChapterNumber() >= startChapter && c.getChapterNumber() <= endChapter)
                .collect(Collectors.toList());

        return chapters.stream()
                .map(this::mapToChapterPreviewResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ChapterResponse autoSaveChapter(UUID chapterId, UpdateChapterRequest request, UUID authorId) {
        request.setIsAutoSave(true);
        log.info("Auto-saving chapter: {}", chapterId);
        return updateChapter(chapterId, request, authorId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChapterPreviewResponse> searchChaptersInStory(UUID storyId, String query, UUID currentUserId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new IllegalArgumentException("Story not found"));

        List<Chapter> chapters = chapterRepository.searchByTitleOrContent(story, query, Chapter.Status.PUBLISHED);

        return chapters.stream()
                .filter(chapter -> canUserAccessChapter(chapter.getId(), currentUserId))
                .map(this::mapToChapterPreviewResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChapterResponse> getChaptersForModeration(Pageable pageable) {
        Page<Chapter> chapters = chapterRepository.findByModerationStatus(Chapter.ModerationStatus.PENDING, pageable);

        // Filter out orphaned chapters (chapters whose stories don't exist) and map to
        // response
        List<ChapterResponse> validChapters = chapters.getContent().stream()
                .map(chapter -> {
                    try {
                        return mapToChapterResponse(chapter, null);
                    } catch (Exception e) {
                        log.warn("Skipping orphaned chapter {} during moderation fetch: {}",
                                chapter.getId(), e.getMessage());
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // Create a new page with filtered results
        return new PageImpl<>(validChapters, pageable, chapters.getTotalElements());
    }

    @Override
    public ChapterResponse moderateChapter(UUID chapterId, String moderationNotes, boolean approved, UUID moderatorId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        chapter.setModerationStatus(approved ? Chapter.ModerationStatus.APPROVED : Chapter.ModerationStatus.REJECTED);
        chapter.setModerationNotes(moderationNotes);
        chapter = chapterRepository.save(chapter);

        log.info("Chapter {} moderated by {}: {}", chapterId, moderatorId, approved ? "APPROVED" : "REJECTED");
        return mapToChapterResponse(chapter, moderatorId);
    }

    // Mapping methods
    private ChapterResponse mapToChapterResponse(Chapter chapter, UUID currentUserId) {
        try {
            // Build navigation info - this might fail if story doesn't exist
        ChapterResponse.NavigationInfo navigation = buildNavigationInfo(chapter, currentUserId);

            // Try to access story info safely
            Story story = chapter.getStory();
            ChapterResponse.StoryInfo storyInfo = ChapterResponse.StoryInfo.builder()
                    .id(story.getId())
                    .title(story.getTitle())
                    .authorUsername(story.getAuthor().getUsername())
                    .totalChapters(story.getTotalChapters())
                    .build();

        return ChapterResponse.builder()
                .id(chapter.getId())
                .chapterNumber(chapter.getChapterNumber())
                .title(chapter.getTitle())
                .content(chapter.getContent())
                .wordCount(chapter.getWordCount())
                .coinPrice(chapter.getCoinPrice())
                .isFree(chapter.getIsFree())
                .status(chapter.getStatus())
                .moderationStatus(chapter.getModerationStatus())
                .moderationNotes(chapter.getModerationNotes())
                    .story(storyInfo)
                .views(chapter.getViews())
                .likes(chapter.getLikes())
                .navigation(navigation)
                .createdAt(chapter.getCreatedAt())
                .updatedAt(chapter.getUpdatedAt())
                .publishedAt(chapter.getPublishedAt())
                .build();

        } catch (Exception e) {
            log.error("Error mapping chapter {} to response, story might be missing: {}", chapter.getId(),
                    e.getMessage());

            // Return a minimal response for orphaned chapters
            return ChapterResponse.builder()
                    .id(chapter.getId())
                    .chapterNumber(chapter.getChapterNumber())
                    .title(chapter.getTitle())
                    .content(chapter.getContent())
                    .wordCount(chapter.getWordCount())
                    .coinPrice(chapter.getCoinPrice())
                    .isFree(chapter.getIsFree())
                    .status(chapter.getStatus())
                    .moderationStatus(chapter.getModerationStatus())
                    .moderationNotes(chapter.getModerationNotes())
                    .story(ChapterResponse.StoryInfo.builder()
                            .id(null)
                            .title("Story Not Found")
                            .authorUsername("Unknown")
                            .totalChapters(0)
                            .build())
                    .views(chapter.getViews())
                    .likes(chapter.getLikes())
                    .navigation(ChapterResponse.NavigationInfo.builder()
                            .nextChapterNumber(null)
                            .previousChapterNumber(null)
                            .hasNext(false)
                            .hasPrevious(false)
                            .totalChapters(0)
                            .build())
                    .createdAt(chapter.getCreatedAt())
                    .updatedAt(chapter.getUpdatedAt())
                    .publishedAt(chapter.getPublishedAt())
                    .build();
        }
    }

    private ChapterPreviewResponse mapToChapterPreviewResponse(Chapter chapter) {
        return ChapterPreviewResponse.builder()
                .id(chapter.getId())
                .chapterNumber(chapter.getChapterNumber())
                .title(chapter.getTitle())
                .wordCount(chapter.getWordCount())
                .coinPrice(chapter.getCoinPrice())
                .isFree(chapter.getIsFree())
                .status(chapter.getStatus())
                .views(chapter.getViews())
                .likes(chapter.getLikes())
                .estimatedReadingTime(calculateReadingTime(chapter.getContent()))
                .createdAt(chapter.getCreatedAt())
                .publishedAt(chapter.getPublishedAt())
                .build();
    }

    private ChapterResponse.NavigationInfo buildNavigationInfo(Chapter chapter, UUID currentUserId) {
        try {
        Story story = chapter.getStory();

        Optional<Chapter> nextChapter = chapterRepository.findNextChapter(
                story, chapter.getChapterNumber(), Chapter.Status.PUBLISHED);
        Optional<Chapter> previousChapter = chapterRepository.findPreviousChapter(
                story, chapter.getChapterNumber(), Chapter.Status.PUBLISHED);

        return ChapterResponse.NavigationInfo.builder()
                .nextChapterNumber(nextChapter.map(Chapter::getChapterNumber).orElse(null))
                .previousChapterNumber(previousChapter.map(Chapter::getChapterNumber).orElse(null))
                .hasNext(nextChapter.isPresent())
                .hasPrevious(previousChapter.isPresent())
                .totalChapters(story.getTotalChapters())
                .build();
        } catch (Exception e) {
            log.warn("Could not build navigation info for chapter {}, story might be missing: {}",
                    chapter.getId(), e.getMessage());

            // Return empty navigation info for orphaned chapters
            return ChapterResponse.NavigationInfo.builder()
                    .nextChapterNumber(null)
                    .previousChapterNumber(null)
                    .hasNext(false)
                    .hasPrevious(false)
                    .totalChapters(0)
                    .build();
        }
    }
}