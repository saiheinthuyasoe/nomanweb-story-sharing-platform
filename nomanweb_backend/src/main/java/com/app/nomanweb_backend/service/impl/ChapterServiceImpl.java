package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.chapter.*;
import com.app.nomanweb_backend.exception.InsufficientFundsException;
import com.app.nomanweb_backend.entity.BookPurchase;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.ChapterPurchase;
import com.app.nomanweb_backend.entity.ChapterRefund;

import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.entity.Library;
import com.app.nomanweb_backend.repository.BookPurchaseRepository;
import com.app.nomanweb_backend.repository.ChapterRepository;
import com.app.nomanweb_backend.repository.StoryRepository;
import com.app.nomanweb_backend.repository.UserRepository;
import com.app.nomanweb_backend.repository.CoinTransactionRepository;
import com.app.nomanweb_backend.repository.ChapterPurchaseRepository;
import com.app.nomanweb_backend.repository.ChapterRefundRepository;
import com.app.nomanweb_backend.repository.LibraryRepository;
import com.app.nomanweb_backend.repository.ReadingProgressRepository;

import com.app.nomanweb_backend.service.ChapterService;
import com.app.nomanweb_backend.service.CollaborationService;
import com.app.nomanweb_backend.service.ViewTrackingService;
import com.app.nomanweb_backend.service.PurchaseProtectionService;
import com.app.nomanweb_backend.service.MonetizationService;
import com.app.nomanweb_backend.service.NotificationService;
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
    private final ChapterPurchaseRepository chapterPurchaseRepository;
    private final BookPurchaseRepository bookPurchaseRepository;
    private final ChapterRefundRepository chapterRefundRepository;
    private final LibraryRepository libraryRepository;
    private final ReadingProgressRepository readingProgressRepository;

    private final CollaborationService collaborationService;
    private final ViewTrackingService viewTrackingService;
    private final PurchaseProtectionService purchaseProtectionService;
    private final MonetizationService monetizationService;
    private final NotificationService notificationService;

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

        // Validate chapter number doesn't exist (only for non-deleted)
        if (chapterRepository.countByStoryAndChapterNumberAndNotDeleted(story, chapterNumber) > 0) {
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

        // Update library status for users if chapter is published
        if (!request.getIsDraft()) {
            updateLibraryStatusForNewChapter(story);
        }

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

        // Validate ownership or collaboration permissions
        boolean isAuthor = chapter.getStory().getAuthor().getId().equals(authorId);
        boolean hasEditPermission = collaborationService.hasEditPermission(chapterId, authorId);

        if (!isAuthor && !hasEditPermission) {
            throw new IllegalArgumentException(
                    "Only the author or collaborators with edit permissions can update this chapter");
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
            // Chapters can now be changed to free without restrictions
            chapter.setIsFree(request.getIsFree());
        }
        if (request.getChapterNumber() != null && !request.getChapterNumber().equals(chapter.getChapterNumber())) {
            // Validate that the new chapter number doesn't already exist (only for
            // non-deleted)
            // Exclude the current chapter being updated to allow keeping the same number
            if (chapterRepository.countByStoryAndChapterNumberAndNotDeletedExcluding(chapter.getStory(),
                    request.getChapterNumber(), chapter.getId()) > 0) {
                throw new IllegalArgumentException(
                        "Chapter number " + request.getChapterNumber() + " already exists in this story");
            }
            log.info("Updating chapter number from {} to {}", chapter.getChapterNumber(), request.getChapterNumber());
            chapter.setChapterNumber(request.getChapterNumber());
        }

        // Handle publishing
        boolean wasJustPublished = false;
        if (request.getShouldPublish() != null) {
            if (request.getShouldPublish() && chapter.getStatus() == Chapter.Status.DRAFT) {
                chapter.setStatus(Chapter.Status.PUBLISHED);
                chapter.setPublishedAt(LocalDateTime.now());
                wasJustPublished = true;
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

        // Update library status for users if chapter was just published
        if (wasJustPublished) {
            updateLibraryStatusForNewChapter(chapter.getStory());

            // Notify followers about new chapter publication
            try {
                notificationService.notifyNewChapter(chapter.getStory().getAuthor().getId(), chapter.getStory().getId(),
                        chapter.getId());
                log.info("Notifications sent to followers for new chapter: {}", chapterId);
            } catch (Exception e) {
                log.warn("Failed to send notifications for new chapter: {} - {}", chapterId, e.getMessage());
                // Don't fail the chapter update if notification fails
            }
        }

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
        // This method now performs soft delete by moving to trash
        moveChapterToTrash(chapterId, authorId);
    }

    @Override
    public void bulkDeleteChapters(List<UUID> chapterIds, UUID authorId) {
        // This method now performs soft delete by moving to trash
        bulkMoveToTrash(chapterIds, authorId);
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
    @Transactional
    public ChapterResponse publishChapter(UUID chapterId, UUID authorId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        if (!chapter.getStory().getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("Only the author can publish this chapter");
        }

        // When a chapter is republished, delete any existing refund records for it
        long deletedRefundsCount = chapterRefundRepository.deleteByChapter(chapter);
        chapterRefundRepository.flush(); // Ensure deletion is committed immediately
        if (deletedRefundsCount > 0) {
            log.info("Deleted {} existing refund records for chapter {}", deletedRefundsCount, chapterId);
        }

        chapter.setStatus(Chapter.Status.PUBLISHED);
        chapter.setPublishedAt(LocalDateTime.now());
        chapter = chapterRepository.save(chapter);

        // Update library status for users who had completed this story
        updateLibraryStatusForNewChapter(chapter.getStory());

        // Notify followers about new chapter publication
        try {
            notificationService.notifyNewChapter(chapter.getStory().getAuthor().getId(), chapter.getStory().getId(),
                    chapter.getId());
            log.info("Notifications sent to followers for new chapter: {}", chapterId);
        } catch (Exception e) {
            log.warn("Failed to send notifications for new chapter: {} - {}", chapterId, e.getMessage());
            // Don't fail the chapter publishing if notification fails
        }

        log.info("Chapter published: {}", chapterId);
        return mapToChapterResponse(chapter, authorId);
    }

    @Override
    public ChapterResponse unpublishChapter(UUID chapterId, UUID authorId, boolean confirmRefund) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        if (!chapter.getStory().getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("Only the author can unpublish this chapter");
        }

        Story story = chapter.getStory();

        // Handle refunds based on pricing type
        if (confirmRefund) {
            if (story.getPricingType() == Story.PricingType.WHOLE_BOOK) {
                // For WHOLE_BOOK pricing, provide simple proportional refund without affecting
                // book access
                List<BookPurchase> activeBookPurchases = bookPurchaseRepository
                        .findByStoryAndIsRefundedFalseOrderByPurchasedAtDesc(story);

                if (!activeBookPurchases.isEmpty()) {
                    log.info("Found {} active book purchases for story: {}", activeBookPurchases.size(), story.getId());

                    // Count total published chapters to calculate proportional refund
                    long totalPublishedChapters = chapterRepository.countByStoryAndStatus(story,
                            Chapter.Status.PUBLISHED);
                    if (totalPublishedChapters > 0) {
                        // Calculate refund amount per chapter: book price / total chapters
                        BigDecimal refundPerChapter = story.getBookPrice()
                                .divide(BigDecimal.valueOf(totalPublishedChapters), 2, java.math.RoundingMode.HALF_UP);

                        // Check if author has enough coins to refund
                        User author = story.getAuthor();
                        BigDecimal totalRefundAmount = refundPerChapter
                                .multiply(BigDecimal.valueOf(activeBookPurchases.size()));

                        if (author.getCoinBalance().compareTo(totalRefundAmount) < 0) {
                            throw new InsufficientFundsException("Insufficient coins to process refunds. Required: " +
                                    totalRefundAmount + ", Available: " + author.getCoinBalance());
                        }

                        // Process simple proportional refunds for all book purchasers
                        // Note: Book purchases remain active, ensuring continued access to other
                        // chapters
                        for (BookPurchase purchase : activeBookPurchases) {
                            // Refund proportional amount to each purchaser
                            monetizationService.addCoins(purchase.getUser(), refundPerChapter,
                                    "Chapter refund: " + chapter.getTitle() + " from " + story.getTitle());

                            // Deduct from author's balance
                            monetizationService.deductCoins(author, refundPerChapter,
                                    "Chapter refund to " + purchase.getUser().getDisplayNameOrUsername() +
                                            " for: " + chapter.getTitle());

                            // Create ChapterRefund record for tracking only (does not affect access)
                            ChapterRefund chapterRefund = ChapterRefund.builder()
                                    .user(purchase.getUser())
                                    .chapter(chapter)
                                    .story(story)
                                    .bookPurchase(purchase)
                                    .refundAmount(refundPerChapter)
                                    .reason("Chapter unpublished: " + chapter.getTitle())
                                    .build();
                            chapterRefundRepository.save(chapterRefund);

                            log.info("Processed proportional refund for book purchase: {} to user: {} amount: {}",
                                    purchase.getId(), purchase.getUser().getId(), refundPerChapter);
                        }

                        log.info(
                                "Successfully processed {} proportional chapter refunds for story: {} - Book access maintained",
                                activeBookPurchases.size(), story.getId());
                    }
                }
            } else if (story.getPricingType() == Story.PricingType.PAID_PER_CHAPTER) {
                // For PAID_PER_CHAPTER pricing, refund individual chapter purchasers
                List<ChapterPurchase> activeChapterPurchases = chapterPurchaseRepository
                        .findByChapterAndIsRefundedFalseOrderByPurchasedAtDesc(chapter);

                if (!activeChapterPurchases.isEmpty()) {
                    log.info("Found {} active chapter purchases for chapter: {}", activeChapterPurchases.size(),
                            chapterId);

                    // Check if author has enough coins to refund
                    User author = story.getAuthor();
                    BigDecimal totalRefundAmount = BigDecimal.ZERO;
                    for (ChapterPurchase purchase : activeChapterPurchases) {
                        totalRefundAmount = totalRefundAmount.add(purchase.getCoinsSpent());
                    }

                    if (author.getCoinBalance().compareTo(totalRefundAmount) < 0) {
                        throw new InsufficientFundsException("Insufficient coins to process refunds. Required: " +
                                totalRefundAmount + ", Available: " + author.getCoinBalance());
                    }

                    // Process refunds for all chapter purchasers
                    for (ChapterPurchase purchase : activeChapterPurchases) {
                        // Refund the full chapter price to each purchaser
                        monetizationService.addCoins(purchase.getUser(), purchase.getCoinsSpent(),
                                "Chapter refund: " + chapter.getTitle() + " from " + story.getTitle());

                        // Deduct from author's balance
                        monetizationService.deductCoins(author, purchase.getCoinsSpent(),
                                "Chapter refund to " + purchase.getUser().getDisplayNameOrUsername() +
                                        " for: " + chapter.getTitle());

                        // Mark purchase as refunded
                        purchase.markAsRefunded();

                        log.info("Processed refund for chapter purchase: {} to user: {} amount: {}",
                                purchase.getId(), purchase.getUser().getId(), purchase.getCoinsSpent());
                    }

                    // Save all refunded purchases
                    chapterPurchaseRepository.saveAll(activeChapterPurchases);

                    log.info("Successfully processed {} chapter refunds for chapter: {}",
                            activeChapterPurchases.size(), chapterId);
                }
            }
        }

        // Unpublish the specific chapter
        chapter.setStatus(Chapter.Status.DRAFT);
        chapterRepository.save(chapter);

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
        // This method is now deprecated in favor of trackChapterView
        // Keeping it for backward compatibility but it should not be used
        log.warn("incrementChapterViews is deprecated. Use ViewTrackingService.trackChapterView instead.");

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

        // Check if user is a collaborator (collaborators can access regardless of
        // chapter status)
        if (userId != null && collaborationService.hasAccessToChapter(chapterId, userId)) {
            log.info("Access granted - User is a collaborator");
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
        log.info("Checking if user {} has purchased chapter {}", userId, chapterId);

        Chapter chapter = chapterRepository.findById(chapterId).orElse(null);
        User user = userRepository.findById(userId).orElse(null);

        if (chapter == null || user == null) {
            return false;
        }

        // Check if user has purchased this chapter
        if (chapterPurchaseRepository.existsByUserAndChapter(user, chapter)) {
            // Get the actual chapter purchase to check purchase date
            java.util.Optional<ChapterPurchase> chapterPurchase = chapterPurchaseRepository.findByUserAndChapter(user,
                    chapter);
            if (chapterPurchase.isPresent() && chapterPurchase.get().isActive()) {
                // Additional check: purchase must be made after the story's current publish
                // date
                // This prevents access from old purchases when a story is republished after
                // refunds
                if (chapter.getStory().getPublishedAt() != null &&
                        chapterPurchase.get().getPurchasedAt().isAfter(chapter.getStory().getPublishedAt())) {
                    log.info("User {} has valid chapter purchase for chapter {} (purchased after current publish date)",
                            userId, chapterId);
                    return true;
                }
                log.info("User {} has chapter purchase for chapter {} but it was made before current publish date",
                        userId, chapterId);
            }
        }

        // Also check if user purchased the whole book (which includes this chapter)
        List<BookPurchase> bookPurchases = bookPurchaseRepository.findByUserAndStoryOrderByPurchasedAtDesc(user,
                chapter.getStory());
        if (!bookPurchases.isEmpty()) {
            // Get the most recent book purchase
            BookPurchase mostRecentBookPurchase = bookPurchases.get(0);
            if (mostRecentBookPurchase.isActive()) {
                // For WHOLE_BOOK pricing, check if there's a chapter limit from previous
                // pricing changes
                if (chapter.getStory().getPricingType() == Story.PricingType.WHOLE_BOOK) {
                    // If chaptersAtPurchase is set, respect the limit (user bought before pricing
                    // change)
                    if (mostRecentBookPurchase.getChaptersAtPurchase() != null) {
                        boolean hasAccess = chapter.getChapterNumber() <= mostRecentBookPurchase
                                .getChaptersAtPurchase();
                        log.info("User {} has book purchase with chapter limit {} for chapter {} - access: {}",
                                userId, mostRecentBookPurchase.getChaptersAtPurchase(), chapterId, hasAccess);
                        return hasAccess;
                    }
                    // If no limit is set, grant access to all chapters (normal whole book purchase)
                    log.info("User {} has valid book purchase for WHOLE_BOOK story - access granted to chapter {}",
                            userId, chapterId);
                    return true;
                }

                // For PAID_PER_CHAPTER pricing, check if purchase was made after story publish
                // date
                if (chapter.getStory().getPublishedAt() != null &&
                        mostRecentBookPurchase.getPurchasedAt().isAfter(chapter.getStory().getPublishedAt())) {
                    log.info("User {} has valid book purchase for chapter {} (purchased after current publish date)",
                            userId, chapterId);
                    return true;
                }
                log.info("User {} has book purchase for chapter {} but it was made before current publish date",
                        userId, chapterId);
            }
        }

        // Note: ChapterRefund records do NOT grant access to republished content
        // Users must repurchase after refunds and republishing

        log.info("User {} has no active purchase for chapter {}", userId, chapterId);
        return false;
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

    // Trash management implementations

    @Override
    public void moveChapterToTrash(UUID chapterId, UUID authorId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        // Validate ownership
        if (!chapter.getStory().getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("Only the author can delete this chapter");
        }

        // Chapters can now be moved to trash without restrictions

        // Move to trash
        chapter.moveToTrash();
        chapterRepository.save(chapter);

        // Update story chapter count (active chapters)
        Story story = chapter.getStory();
        story.setTotalChapters(Math.max(0, story.getTotalChapters() - 1));
        storyRepository.save(story);

        log.info("Chapter moved to trash: {}", chapterId);
    }

    @Override
    public void restoreChapterFromTrash(UUID chapterId, UUID authorId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        // Validate ownership
        if (!chapter.getStory().getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("Only the author can restore this chapter");
        }

        if (!chapter.isInTrash()) {
            throw new IllegalArgumentException("Chapter is not in trash");
        }

        // Restore from trash
        chapter.restoreFromTrash();
        chapterRepository.save(chapter);

        // Update story chapter count (active chapters)
        Story story = chapter.getStory();
        story.setTotalChapters(story.getTotalChapters() + 1);
        storyRepository.save(story);

        log.info("Chapter restored from trash: {}", chapterId);
    }

    @Override
    public void permanentlyDeleteChapter(UUID chapterId, UUID authorId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Chapter not found"));

        // Validate ownership
        if (!chapter.getStory().getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("Only the author can permanently delete this chapter");
        }

        if (!chapter.isInTrash()) {
            throw new IllegalArgumentException("Chapter must be in trash before permanent deletion");
        }

        // No purchase protection check needed for permanent deletion from trash
        // Chapters in trash have already gone through the refund process

        // Permanently delete
        chapterRepository.delete(chapter);

        log.info("Chapter permanently deleted: {}", chapterId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChapterPreviewResponse> getTrashByStory(UUID storyId, UUID authorId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new IllegalArgumentException("Story not found"));

        // Validate ownership
        if (!story.getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("Only the author can view trash");
        }

        List<Chapter> trashChapters = chapterRepository.findTrashByStory(story);
        return trashChapters.stream()
                .map(this::mapToChapterPreviewResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void bulkMoveToTrash(List<UUID> chapterIds, UUID authorId) {
        log.info("Bulk moving {} chapters to trash for author: {}", chapterIds.size(), authorId);

        if (chapterIds.isEmpty()) {
            return;
        }

        // Fetch all chapters and validate ownership
        List<Chapter> chapters = chapterRepository.findAllById(chapterIds);

        if (chapters.size() != chapterIds.size()) {
            throw new IllegalArgumentException("Some chapters were not found");
        }

        // Validate that all chapters belong to the same author
        for (Chapter chapter : chapters) {
            if (!chapter.getStory().getAuthor().getId().equals(authorId)) {
                throw new IllegalArgumentException("Only the author can delete chapters");
            }
        }

        // Group chapters by story for efficient processing
        var chaptersByStory = chapters.stream()
                .collect(Collectors.groupingBy(Chapter::getStory));

        // Move chapters to trash and update story counts
        for (var entry : chaptersByStory.entrySet()) {
            Story story = entry.getKey();
            List<Chapter> storyChapters = entry.getValue();

            // Move all chapters to trash
            for (Chapter chapter : storyChapters) {
                chapter.moveToTrash();
            }
            chapterRepository.saveAll(storyChapters);

            // Update story chapter count
            int deletedCount = storyChapters.size();
            story.setTotalChapters(Math.max(0, story.getTotalChapters() - deletedCount));
            storyRepository.save(story);

            log.info("Moved {} chapters to trash from story: {}", deletedCount, story.getId());
        }

        log.info("Bulk move to trash completed successfully for {} chapters", chapterIds.size());
    }

    @Override
    public void bulkRestoreFromTrash(List<UUID> chapterIds, UUID authorId) {
        log.info("Bulk restoring {} chapters from trash for author: {}", chapterIds.size(), authorId);

        if (chapterIds.isEmpty()) {
            return;
        }

        // Fetch all chapters and validate ownership
        List<Chapter> chapters = chapterRepository.findAllById(chapterIds);

        if (chapters.size() != chapterIds.size()) {
            throw new IllegalArgumentException("Some chapters were not found");
        }

        // Validate that all chapters belong to the same author and are in trash
        for (Chapter chapter : chapters) {
            if (!chapter.getStory().getAuthor().getId().equals(authorId)) {
                throw new IllegalArgumentException("Only the author can restore chapters");
            }
            if (!chapter.isInTrash()) {
                throw new IllegalArgumentException("Chapter is not in trash: " + chapter.getId());
            }
        }

        // Group chapters by story for efficient processing
        var chaptersByStory = chapters.stream()
                .collect(Collectors.groupingBy(Chapter::getStory));

        // Restore chapters and update story counts
        for (var entry : chaptersByStory.entrySet()) {
            Story story = entry.getKey();
            List<Chapter> storyChapters = entry.getValue();

            // Restore all chapters
            for (Chapter chapter : storyChapters) {
                chapter.restoreFromTrash();
            }
            chapterRepository.saveAll(storyChapters);

            // Update story chapter count
            int restoredCount = storyChapters.size();
            story.setTotalChapters(story.getTotalChapters() + restoredCount);
            storyRepository.save(story);

            log.info("Restored {} chapters from trash for story: {}", restoredCount, story.getId());
        }

        log.info("Bulk restore from trash completed successfully for {} chapters", chapterIds.size());
    }

    @Override
    public void bulkPermanentlyDelete(List<UUID> chapterIds, UUID authorId) {
        log.info("Permanently deleting {} chapters for author: {}", chapterIds.size(), authorId);

        if (chapterIds.isEmpty()) {
            return;
        }

        // Fetch all chapters and validate ownership
        List<Chapter> chapters = chapterRepository.findAllById(chapterIds);

        if (chapters.size() != chapterIds.size()) {
            throw new IllegalArgumentException("Some chapters were not found");
        }

        // Validate that all chapters belong to the same author and are in trash
        for (Chapter chapter : chapters) {
            if (!chapter.getStory().getAuthor().getId().equals(authorId)) {
                throw new IllegalArgumentException("Only the author can permanently delete chapters");
            }
            if (!chapter.isInTrash()) {
                throw new IllegalArgumentException(
                        "Chapter must be in trash before permanent deletion: " + chapter.getId());
            }
        }

        // Permanently delete all chapters
        chapterRepository.deleteAll(chapters);

        log.info("Permanently deleted {} chapters", chapterIds.size());
    }

    @Override
    public void emptyTrash(UUID storyId, UUID authorId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new IllegalArgumentException("Story not found"));

        // Validate ownership
        if (!story.getAuthor().getId().equals(authorId)) {
            throw new IllegalArgumentException("Only the author can empty trash");
        }

        List<Chapter> trashChapters = chapterRepository.findTrashByStory(story);

        if (trashChapters.isEmpty()) {
            log.info("No chapters in trash for story: {}", storyId);
            return;
        }

        // Permanently delete all chapters in trash
        chapterRepository.deleteAll(trashChapters);

        log.info("Emptied trash: permanently deleted {} chapters from story: {}", trashChapters.size(), storyId);
    }

    @Override
    public void bulkPublishChaptersByStory(UUID storyId, UUID authorId) {
        log.info("Bulk publishing chapters for story: {} by author: {}", storyId, authorId);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        if (!story.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Not authorized to publish chapters for this story");
        }

        // Find all draft chapters for this story that are not in trash
        List<Chapter> draftChapters = chapterRepository.findByStoryAndStatus(
                story, Chapter.Status.DRAFT);

        if (draftChapters.isEmpty()) {
            log.info("No draft chapters found to publish for story: {}", storyId);
            return;
        }

        // Publish all draft chapters
        LocalDateTime publishTime = LocalDateTime.now();
        for (Chapter chapter : draftChapters) {
            chapter.setStatus(Chapter.Status.PUBLISHED);
            chapter.setPublishedAt(publishTime);
        }

        chapterRepository.saveAll(draftChapters);

        // Update library status for users since new chapters were published
        if (!draftChapters.isEmpty()) {
            updateLibraryStatusForNewChapter(story);
        }

        // Notify followers about each newly published chapter
        for (Chapter publishedChapter : draftChapters) {
            try {
                notificationService.notifyNewChapter(publishedChapter.getStory().getAuthor().getId(),
                        publishedChapter.getStory().getId(), publishedChapter.getId());
                log.info("Notifications sent to followers for bulk published chapter: {}", publishedChapter.getId());
            } catch (Exception e) {
                log.warn("Failed to send notifications for bulk published chapter: {} - {}", publishedChapter.getId(),
                        e.getMessage());
                // Don't fail the bulk publish if notification fails
            }
        }

        log.info("Successfully published {} chapters for story: {}", draftChapters.size(), storyId);
    }

    @Override
    public void bulkUnpublishChaptersByStory(UUID storyId, UUID authorId) {
        log.info("Bulk unpublishing chapters for story: {} by author: {}", storyId, authorId);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        if (!story.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Not authorized to unpublish chapters for this story");
        }

        // Find all published chapters for this story that are not in trash
        List<Chapter> publishedChapters = chapterRepository.findByStoryAndStatus(
                story, Chapter.Status.PUBLISHED);

        if (publishedChapters.isEmpty()) {
            log.info("No published chapters found to unpublish for story: {}", storyId);
            return;
        }

        // Unpublish all published chapters
        for (Chapter publishedChapter : chapterRepository.findByStoryAndStatus(
                story, Chapter.Status.PUBLISHED)) {
            publishedChapter.setStatus(Chapter.Status.DRAFT);
            // Keep the original publishedAt timestamp for historical purposes
        }

        chapterRepository.saveAll(publishedChapters);

        log.info("Successfully unpublished {} chapters for story: {}", publishedChapters.size(), storyId);
    }

    @Override
    public void unpublishWholeBook(UUID storyId, UUID authorId, boolean confirmRefund) {
        log.info("Unpublishing whole book for story: {} by author: {} with confirmRefund: {}", storyId, authorId,
                confirmRefund);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        if (!story.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Not authorized to unpublish this story");
        }

        List<Chapter> publishedChapters = chapterRepository.findByStoryAndStatus(
                story, Chapter.Status.PUBLISHED);

        // Handle refunds for both WHOLE_BOOK and PAID_PER_CHAPTER pricing
        if (story.getPricingType() == Story.PricingType.WHOLE_BOOK) {
            List<BookPurchase> activeBookPurchases = bookPurchaseRepository
                    .findByStoryAndIsRefundedFalseOrderByPurchasedAtDesc(story);

            if (!activeBookPurchases.isEmpty()) {
                log.info("Found {} active book purchases for story: {}", activeBookPurchases.size(), storyId);

                BigDecimal totalRefundAmount = activeBookPurchases.stream()
                        .map(BookPurchase::getCoinsSpent)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                User author = story.getAuthor();
                if (author.getCoinBalance().compareTo(totalRefundAmount) < 0) {
                    throw new InsufficientFundsException("Insufficient coins to process refunds. Required: " +
                            totalRefundAmount + ", Available: " + author.getCoinBalance());
                }

                for (BookPurchase purchase : activeBookPurchases) {
                    monetizationService.addCoins(purchase.getUser(), purchase.getCoinsSpent(),
                            "Book refund: " + story.getTitle() + " (unpublished)");
                    monetizationService.deductCoins(author, purchase.getCoinsSpent(),
                            "Book refund to " + purchase.getUser().getDisplayNameOrUsername() +
                                    " for: " + story.getTitle());

                    purchase.markAsRefunded(); // Mark as refunded so access is lost
                    log.info("Marked purchase {} as refunded: isRefunded={}, refundedAt={}", purchase.getId(),
                            purchase.getIsRefunded(), purchase.getRefundedAt());
                }
                bookPurchaseRepository.saveAll(activeBookPurchases);
            }
        } else if (story.getPricingType() == Story.PricingType.PAID_PER_CHAPTER) {
            List<ChapterPurchase> allActiveChapterPurchases = new java.util.ArrayList<>();
            for (Chapter chapter : publishedChapters) {
                allActiveChapterPurchases.addAll(
                        chapterPurchaseRepository.findByChapterAndIsRefundedFalseOrderByPurchasedAtDesc(chapter));
            }

            if (!allActiveChapterPurchases.isEmpty()) {
                log.info("Found {} active chapter purchases for story: {}", allActiveChapterPurchases.size(), storyId);

                BigDecimal totalRefundAmount = allActiveChapterPurchases.stream()
                        .map(ChapterPurchase::getCoinsSpent)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                User author = story.getAuthor();
                if (author.getCoinBalance().compareTo(totalRefundAmount) < 0) {
                    throw new InsufficientFundsException("Insufficient coins to process refunds. Required: " +
                            totalRefundAmount + ", Available: " + author.getCoinBalance());
                }

                for (ChapterPurchase purchase : allActiveChapterPurchases) {
                    monetizationService.addCoins(purchase.getUser(), purchase.getCoinsSpent(),
                            "Chapter refund: " + purchase.getChapter().getTitle() + " from " + story.getTitle()
                                    + " (book unpublished)");
                    monetizationService.deductCoins(author, purchase.getCoinsSpent(),
                            "Chapter refund to " + purchase.getUser().getDisplayNameOrUsername() +
                                    " for: " + purchase.getChapter().getTitle());
                    // We don't mark as refunded, so the user keeps access
                }
            }
        }

        // Unpublish all chapters
        if (!publishedChapters.isEmpty()) {
            for (Chapter chapter : publishedChapters) {
                chapter.setStatus(Chapter.Status.DRAFT);
            }
            chapterRepository.saveAll(publishedChapters);
        }

        // Update story publish status to DRAFT
        story.setPublishStatus(Story.PublishStatus.DRAFT);
        storyRepository.save(story);

        log.info("Successfully unpublished whole book with {} chapters for story: {}", publishedChapters.size(),
                storyId);
    }

    /**
     * Update library status for users who had completed a story when a new chapter
     * is published
     * This moves stories from COMPLETED back to READING status without resetting
     * reading progress
     * The individual chapter progress remains intact, only the library
     * categorization changes
     */
    private void updateLibraryStatusForNewChapter(Story story) {
        try {
            // Find all users who have this story in their COMPLETED list
            List<Library> completedEntries = libraryRepository.findByStoryIdAndListType(
                    story.getId(), Library.ListType.COMPLETED);

            if (completedEntries.isEmpty()) {
                log.info("No users have completed story {} - no library updates needed", story.getId());
                return;
            }

            log.info("Found {} users who completed story {} - updating their library status",
                    completedEntries.size(), story.getId());

            // Get total published chapters for this story
            long totalChapters = chapterRepository.countByStoryAndStatus(
                    story, Chapter.Status.PUBLISHED);

            for (Library completedEntry : completedEntries) {
                User user = completedEntry.getUser();

                // Get completed chapters count for this user and story
                long completedChapters = readingProgressRepository.countCompletedChaptersByUserAndStory(
                        user.getId(), story.getId());

                // Check if story is still completed (all chapters read)
                boolean isStillCompleted = totalChapters > 0 && completedChapters >= totalChapters;

                if (!isStillCompleted) {
                    // Move from COMPLETED back to READING
                    // Remove from COMPLETED
                    libraryRepository.deleteByUserIdAndStoryIdAndListTypeIn(
                            user.getId(), story.getId(), List.of(Library.ListType.COMPLETED));

                    // Update story counts
                    story.setTotalCompleted(Math.max(0, story.getTotalCompleted() - 1));

                    // Add to READING (check again to prevent duplicates)
                    if (!libraryRepository.existsByUserIdAndStoryIdAndListType(
                            user.getId(), story.getId(), Library.ListType.READING)) {
                        Library readingEntry = Library.builder()
                                .user(user)
                                .story(story)
                                .listType(Library.ListType.READING)
                                .build();
                        libraryRepository.save(readingEntry);
                    }

                    // Update story counts
                    story.setTotalCurrentlyReading(story.getTotalCurrentlyReading() + 1);

                    log.info(
                            "Moved story {} from COMPLETED back to READING for user {} due to new chapter (reading progress preserved)",
                            story.getId(), user.getId());
                }
            }

            // Save updated story counts
            storyRepository.save(story);

        } catch (Exception e) {
            log.error("Error updating library status for new chapter in story {}: {}",
                    story.getId(), e.getMessage(), e);
            // Don't throw exception to avoid breaking the chapter publishing process
        }
    }
}