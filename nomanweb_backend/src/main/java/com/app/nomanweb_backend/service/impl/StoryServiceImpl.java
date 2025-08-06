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
import com.app.nomanweb_backend.repository.ChapterRepository;
import com.app.nomanweb_backend.service.StoryService;
import com.app.nomanweb_backend.service.SearchIndexingService;
import com.app.nomanweb_backend.service.PurchaseProtectionService;
import com.app.nomanweb_backend.service.PurchaseProtectionException;
import com.app.nomanweb_backend.service.ChapterService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.math.RoundingMode;
import java.util.stream.Collectors;
import java.util.ArrayList;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.BookPurchase;
import com.app.nomanweb_backend.entity.ChapterPurchase;
import com.app.nomanweb_backend.repository.BookPurchaseRepository;
import com.app.nomanweb_backend.repository.ChapterPurchaseRepository;
import com.app.nomanweb_backend.service.MonetizationService;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StoryServiceImpl implements StoryService {

    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final PurchaseProtectionService purchaseProtectionService;
    private final ChapterService chapterService;

    private final ChapterRepository chapterRepository;
    private final BookPurchaseRepository bookPurchaseRepository;
    private final ChapterPurchaseRepository chapterPurchaseRepository;
    private final MonetizationService monetizationService;

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

        // Store original pricing type to detect changes
        Story.PricingType originalPricingType = story.getPricingType();

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
            // Pricing can now be changed without restrictions
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

        // Handle pricing model change refunds
        if (request.getPricingType() != null && !originalPricingType.equals(request.getPricingType())) {
            handlePricingModelChangeRefunds(story, originalPricingType, request.getPricingType());
        }

        story = storyRepository.save(story);
        log.info("Story updated successfully: {}", storyId);

        // Publish event for search indexing
        eventPublisher.publishEvent(new SearchIndexingService.StoryUpdatedEvent(story));

        return convertToStoryResponse(story);
    }

    /**
     * Handle refunds when pricing model changes according to the flowchart logic:
     * - WHOLE_BOOK to FREE: Refund all book purchasers
     * - WHOLE_BOOK to PAID_PER_CHAPTER: No refunds, users keep access to existing
     * chapters
     * - Any pricing to FREE: Refund affected purchasers
     */
    @Transactional
    private void handlePricingModelChangeRefunds(Story story, Story.PricingType originalPricingType,
            Story.PricingType newPricingType) {
        log.info("🔄 Handling pricing model change for story: {} from {} to {}",
                story.getId(), originalPricingType, newPricingType);

        // Case 1: WHOLE_BOOK to PAID_PER_CHAPTER - No refunds needed
        // Users who bought the whole book keep access to all current chapters
        // They will need to buy new chapters added after the pricing change
        if (originalPricingType == Story.PricingType.WHOLE_BOOK
                && newPricingType == Story.PricingType.PAID_PER_CHAPTER) {
            log.info(
                    "📚➡️📖 WHOLE_BOOK to PAID_PER_CHAPTER: No refunds needed. Users keep access to existing chapters.");

            // Update book purchases to track chapters available at time of purchase
            List<BookPurchase> bookPurchases = bookPurchaseRepository.findActiveByStoryOrderByPurchasedAtDesc(story);
            long currentChapterCount = chapterRepository.countByStory(story);

            for (BookPurchase purchase : bookPurchases) {
                purchase.setChaptersAtPurchase((int) currentChapterCount);
                bookPurchaseRepository.save(purchase);
            }

            log.info("✅ Updated {} book purchases with current chapter count: {}",
                    bookPurchases.size(), currentChapterCount);
            return;
        }

        // Case 2: Any pricing model to FREE - Refund affected purchasers
        if (newPricingType == Story.PricingType.FREE) {
            log.info("💰 Pricing changed to FREE - calculating refunds");

            if (originalPricingType == Story.PricingType.WHOLE_BOOK) {
                // Refund all book purchasers the full book price
                refundBookPurchasers(story);
            } else if (originalPricingType == Story.PricingType.PAID_PER_CHAPTER) {
                // Refund all chapter purchasers
                refundChapterPurchasers(story);
            }
            return;
        }

        // Case 3: PAID_PER_CHAPTER to WHOLE_BOOK - Grant full access to chapter
        // purchasers
        // Users who bought individual chapters get full access to all chapters
        // (including future ones)
        if (originalPricingType == Story.PricingType.PAID_PER_CHAPTER
                && newPricingType == Story.PricingType.WHOLE_BOOK) {
            log.info("📖➡️📚 PAID_PER_CHAPTER to WHOLE_BOOK: Granting full access to existing chapter purchasers.");
            grantFullAccessToChapterPurchasers(story);
            return;
        }

        log.info("ℹ️ No refund action needed for pricing change from {} to {}", originalPricingType, newPricingType);
    }

    /**
     * Refund all active book purchasers for a story using partial refund formula:
     * Each user gets: Book price ÷ Number of chapters
     */
    @Transactional
    private void refundBookPurchasers(Story story) {
        List<BookPurchase> activeBookPurchases = bookPurchaseRepository.findActiveByStoryOrderByPurchasedAtDesc(story);

        if (activeBookPurchases.isEmpty()) {
            log.info("📚 No active book purchases to refund for story: {}", story.getId());
            return;
        }

        // Get the number of chapters for partial refund calculation
        long chapterCount = chapterRepository.countByStory(story);

        if (chapterCount == 0) {
            log.warn("⚠️ Story has no chapters, using full refund for book purchases");
            // If no chapters, give full refund
            refundBookPurchasersFullAmount(story, activeBookPurchases);
            return;
        }

        BigDecimal totalRefunded = BigDecimal.ZERO;
        int refundedCount = 0;

        log.info("📊 Calculating partial refunds: {} chapters found, {} book purchasers",
                chapterCount, activeBookPurchases.size());

        for (BookPurchase purchase : activeBookPurchases) {
            try {
                // Calculate partial refund: Book price ÷ Number of chapters
                BigDecimal partialRefundAmount = purchase.getCoinsSpent()
                        .divide(BigDecimal.valueOf(chapterCount), 2, RoundingMode.HALF_UP);

                // Add coins back to user
                monetizationService.addCoins(purchase.getUser(), partialRefundAmount,
                        "Partial refund for pricing model change: " + story.getTitle());

                // Mark purchase as refunded
                purchase.markAsRefunded();
                bookPurchaseRepository.save(purchase);

                totalRefunded = totalRefunded.add(partialRefundAmount);
                refundedCount++;

                log.info("💰 Partial refund: {} coins (from {} total) to user {} for book purchase",
                        partialRefundAmount, purchase.getCoinsSpent(), purchase.getUser().getUsername());

            } catch (Exception e) {
                log.error("❌ Failed to refund book purchase {} for user {}: {}",
                        purchase.getId(), purchase.getUser().getUsername(), e.getMessage());
            }
        }

        log.info("✅ Completed partial book refunds: {} users refunded, {} total coins (partial amounts)",
                refundedCount, totalRefunded);
    }

    /**
     * Helper method for full refunds when chapter count is 0
     */
    @Transactional
    private void refundBookPurchasersFullAmount(Story story, List<BookPurchase> activeBookPurchases) {
        BigDecimal totalRefunded = BigDecimal.ZERO;
        int refundedCount = 0;

        for (BookPurchase purchase : activeBookPurchases) {
            try {
                // Add full coins back to user
                monetizationService.addCoins(purchase.getUser(), purchase.getCoinsSpent(),
                        "Full refund for pricing model change (no chapters): " + story.getTitle());

                // Mark purchase as refunded
                purchase.markAsRefunded();
                bookPurchaseRepository.save(purchase);

                totalRefunded = totalRefunded.add(purchase.getCoinsSpent());
                refundedCount++;

                log.info("💰 Full refund: {} coins to user {} for book purchase",
                        purchase.getCoinsSpent(), purchase.getUser().getUsername());

            } catch (Exception e) {
                log.error("❌ Failed to refund book purchase {} for user {}: {}",
                        purchase.getId(), purchase.getUser().getUsername(), e.getMessage());
            }
        }

        log.info("✅ Completed full book refunds: {} users refunded, {} total coins", refundedCount, totalRefunded);
    }

    /**
     * Refund all active chapter purchasers for a story using partial refund
     * formula:
     * Each user gets a partial refund based on: Book price ÷ Number of chapters
     * Note: For chapter purchases, we calculate as if they bought the equivalent
     * book value
     */
    @Transactional
    private void refundChapterPurchasers(Story story) {
        List<ChapterPurchase> activeChapterPurchases = chapterPurchaseRepository
                .findByStoryAndIsRefundedFalseOrderByPurchasedAtDesc(story);

        if (activeChapterPurchases.isEmpty()) {
            log.info("📖 No active chapter purchases to refund for story: {}", story.getId());
            return;
        }

        // Get the number of chapters for partial refund calculation
        long chapterCount = chapterRepository.countByStory(story);

        if (chapterCount == 0) {
            log.warn("⚠️ Story has no chapters, using full refund for chapter purchases");
            // If no chapters, give full refund
            refundChapterPurchasersFullAmount(story, activeChapterPurchases);
            return;
        }

        BigDecimal totalRefunded = BigDecimal.ZERO;
        int refundedCount = 0;

        log.info("📊 Calculating partial refunds for chapters: {} chapters found, {} chapter purchasers",
                chapterCount, activeChapterPurchases.size());

        for (ChapterPurchase purchase : activeChapterPurchases) {
            try {
                // Calculate partial refund: Chapter price ÷ Number of chapters
                // This represents the proportional value of each chapter
                BigDecimal partialRefundAmount = purchase.getCoinsSpent()
                        .divide(BigDecimal.valueOf(chapterCount), 2, RoundingMode.HALF_UP);

                // Add coins back to user
                monetizationService.addCoins(purchase.getUser(), partialRefundAmount,
                        "Partial refund for pricing model change: " + story.getTitle());

                // Mark purchase as refunded
                purchase.setIsRefunded(true);
                purchase.setRefundedAt(LocalDateTime.now());
                chapterPurchaseRepository.save(purchase);

                totalRefunded = totalRefunded.add(partialRefundAmount);
                refundedCount++;

                log.info("💰 Partial refund: {} coins (from {} total) to user {} for chapter purchase",
                        partialRefundAmount, purchase.getCoinsSpent(), purchase.getUser().getUsername());

            } catch (Exception e) {
                log.error("❌ Failed to refund chapter purchase {} for user {}: {}",
                        purchase.getId(), purchase.getUser().getUsername(), e.getMessage());
            }
        }

        log.info("✅ Completed partial chapter refunds: {} users refunded, {} total coins (partial amounts)",
                refundedCount, totalRefunded);
    }

    /**
     * Helper method for full chapter refunds when chapter count is 0
     */
    @Transactional
    private void refundChapterPurchasersFullAmount(Story story, List<ChapterPurchase> activeChapterPurchases) {
        BigDecimal totalRefunded = BigDecimal.ZERO;
        int refundedCount = 0;

        for (ChapterPurchase purchase : activeChapterPurchases) {
            try {
                // Add full coins back to user
                monetizationService.addCoins(purchase.getUser(), purchase.getCoinsSpent(),
                        "Full refund for pricing model change (no chapters): " + story.getTitle());

                // Mark purchase as refunded
                purchase.setIsRefunded(true);
                purchase.setRefundedAt(LocalDateTime.now());
                chapterPurchaseRepository.save(purchase);

                totalRefunded = totalRefunded.add(purchase.getCoinsSpent());
                refundedCount++;

                log.info("💰 Full refund: {} coins to user {} for chapter purchase",
                        purchase.getCoinsSpent(), purchase.getUser().getUsername());

            } catch (Exception e) {
                log.error("❌ Failed to refund chapter purchase {} for user {}: {}",
                        purchase.getId(), purchase.getUser().getUsername(), e.getMessage());
            }
        }

        log.info("✅ Completed full chapter refunds: {} users refunded, {} total coins", refundedCount, totalRefunded);
    }

    /**
     * Grant full access to users who previously bought individual chapters
     * when pricing changes from PAID_PER_CHAPTER to WHOLE_BOOK
     */
    @Transactional
    private void grantFullAccessToChapterPurchasers(Story story) {
        // Find all users who have active chapter purchases for this story
        List<ChapterPurchase> activeChapterPurchases = chapterPurchaseRepository
                .findActiveByStoryOrderByPurchasedAtDesc(story);

        if (activeChapterPurchases.isEmpty()) {
            log.info("📚 No active chapter purchases found for story: {}", story.getId());
            return;
        }

        // Group purchases by user to avoid duplicate book purchases
        Map<User, List<ChapterPurchase>> purchasesByUser = activeChapterPurchases.stream()
                .collect(Collectors.groupingBy(ChapterPurchase::getUser));

        int grantedCount = 0;

        for (Map.Entry<User, List<ChapterPurchase>> entry : purchasesByUser.entrySet()) {
            User user = entry.getKey();
            List<ChapterPurchase> userPurchases = entry.getValue();

            try {
                // Check if user already has a book purchase for this story
                List<BookPurchase> existingBookPurchases = bookPurchaseRepository
                        .findByUserAndStoryOrderByPurchasedAtDesc(user, story);
                boolean hasActiveBookPurchase = existingBookPurchases.stream().anyMatch(BookPurchase::isActive);

                if (!hasActiveBookPurchase) {
                    // Create a virtual book purchase to grant full access
                    BookPurchase virtualBookPurchase = new BookPurchase();
                    virtualBookPurchase.setUser(user);
                    virtualBookPurchase.setStory(story);
                    virtualBookPurchase.setCoinsSpent(BigDecimal.ZERO); // No cost for this virtual purchase
                    virtualBookPurchase.setPurchasedAt(LocalDateTime.now());
                    virtualBookPurchase.setIsRefunded(false);
                    virtualBookPurchase.setChaptersAtPurchase(story.getChapters().size()); // Set to current chapter
                                                                                           // count for full access

                    bookPurchaseRepository.save(virtualBookPurchase);
                    grantedCount++;

                    log.info("📖➡️📚 Granted full access to user {} who had {} chapter purchases for story {}",
                            user.getUsername(), userPurchases.size(), story.getId());
                } else {
                    log.info("📚 User {} already has book purchase for story {}, skipping",
                            user.getUsername(), story.getId());
                }

            } catch (Exception e) {
                log.error("❌ Failed to grant full access to user {} for story {}: {}",
                        user.getUsername(), story.getId(), e.getMessage());
            }
        }

        log.info("✅ Granted full access to {} users who previously bought individual chapters for story {}",
                grantedCount, story.getId());
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

        if (!story.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Not authorized to delete this story");
        }

        // Unpublish the story and process refunds if necessary
        if (story.getPublishStatus() == Story.PublishStatus.PUBLISHED) {
            chapterService.unpublishWholeBook(storyId, authorId, true); // This handles refunds and sets status to DRAFT
        }

        // The story object might be stale after the unpublish call. Re-fetch for
        // safety.
        Story storyToTrash = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story disappeared after unpublish call"));

        storyToTrash.moveToTrash();
        storyRepository.save(storyToTrash);

        log.info("✅ Story moved to trash successfully: {}", storyId);

        // Publish event for search indexing
        eventPublisher.publishEvent(new SearchIndexingService.StoryUpdatedEvent(storyToTrash));
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

        // No purchase protection check needed for permanent deletion from trash
        // Stories in trash have already gone through the refund process

        // Log related entities that will be cascade deleted
        log.info(
                "📚 Story '{}' has {} chapters, {} comments, {} reading progress, {} reading lists, {} gift transactions, {} chapter purchases that will be cascade deleted",
                story.getTitle(),
                story.getChapters().size(),
                story.getComments().size(),
                story.getReadingProgress().size(),
                story.getLibraries().size(),
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
        int totalReadingLists = stories.stream().mapToInt(s -> s.getLibraries().size()).sum();
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
        int totalReadingLists = trashStories.stream().mapToInt(s -> s.getLibraries().size()).sum();
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
        return publishStory(storyId, authorId, true);
    }

    @Override
    public StoryResponse publishStory(UUID storyId, UUID authorId, boolean autoPublishChapters) {
        log.info("Publishing story: {} by author: {} with autoPublishChapters: {}", storyId, authorId,
                autoPublishChapters);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        if (!story.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Not authorized to publish this story");
        }

        story.setPublishStatus(Story.PublishStatus.PUBLISHED);

        // Check if this is a republish after refunds
        boolean isRepublishAfterRefunds = false;
        if (story.getPricingType() == Story.PricingType.WHOLE_BOOK) {
            // Check if there are any refunded book purchases
            List<BookPurchase> refundedPurchases = bookPurchaseRepository
                    .findByStoryAndIsRefundedTrueOrderByPurchasedAtDesc(story);
            if (!refundedPurchases.isEmpty()) {
                isRepublishAfterRefunds = true;
                log.info("Republishing story after refunds - {} refunded purchases found", refundedPurchases.size());
            }
        }

        // Set publishedAt based on republish scenario
        if (story.getPublishedAt() == null) {
            // Initial publication
            story.setPublishedAt(LocalDateTime.now());
            log.info("Setting initial publish date for story: {}", storyId);
        } else if (isRepublishAfterRefunds) {
            // Republish after refunds - update publish date so old purchases don't work
            story.setPublishedAt(LocalDateTime.now());
            log.info("Republishing story after refunds - updating publish date for story: {} to {}", storyId,
                    story.getPublishedAt());
        } else {
            // Regular republish - keep original publish date
            log.info("Republishing story: {} - keeping original publish date: {}", storyId, story.getPublishedAt());
        }

        story = storyRepository.save(story);

        log.info("Story published successfully: {}", storyId);

        // Automatically publish all draft chapters when story is published (only if
        // autoPublishChapters is true)
        if (autoPublishChapters) {
            try {
                chapterService.bulkPublishChaptersByStory(storyId, authorId);
                log.info("All draft chapters published automatically for story: {}", storyId);
            } catch (Exception e) {
                log.warn("Failed to auto-publish chapters for story: {} - {}", storyId, e.getMessage());
                // Don't fail the story publishing if chapter publishing fails
            }
        } else {
            log.info("Skipping auto-publish of chapters for story: {} (autoPublishChapters=false)", storyId);
        }

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

        // Delegate unpublishing to a method that handles refunds, fixing a flaw where
        // the action was blocked instead of processing refunds for active purchases.
        // This assumes `chapterService.unpublishWholeBook` contains all necessary
        // logic.
        chapterService.unpublishWholeBook(storyId, authorId, true);

        // The story status is updated within the delegated method, so we fetch the
        // updated story.
        Story updatedStory = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found after unpublishing"));

        log.info("Story unpublished via unpublishWholeBook: {}", updatedStory.getId());

        // Publish event for search indexing to reflect the update.
        eventPublisher.publishEvent(new SearchIndexingService.StoryUpdatedEvent(updatedStory));

        return convertToStoryResponse(updatedStory);
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
                .totalWantToRead(story.getTotalWantToRead())
                .totalCompleted(story.getTotalCompleted())
                .totalCurrentlyReading(story.getTotalCurrentlyReading())
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

    @Override
    @Transactional
    public Map<String, Object> recalculateStoryEarnings(UUID storyId, UUID authorId) {
        log.info("Recalculating earnings for story: {} by author: {}", storyId, authorId);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        // Check if user is the author
        if (!story.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Not authorized to recalculate earnings for this story");
        }

        // Calculate total earnings from chapter purchases (70% of purchase amount)
        BigDecimal chapterEarnings = chapterPurchaseRepository.findByStoryAndIsRefundedFalseOrderByPurchasedAtDesc(story)
                .stream()
                .map(purchase -> purchase.getCoinsSpent().multiply(new BigDecimal("0.70")))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate total earnings from book purchases (70% of purchase amount)
        BigDecimal bookEarnings = bookPurchaseRepository.findByStoryAndIsRefundedFalseOrderByPurchasedAtDesc(story)
                .stream()
                .map(purchase -> purchase.getCoinsSpent().multiply(new BigDecimal("0.70")))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate total earnings from gift transactions
        BigDecimal giftEarnings = story.getGiftTransactions()
                .stream()
                .map(giftTransaction -> giftTransaction.getTotalCoins())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate total earnings
        BigDecimal totalEarnings = chapterEarnings.add(bookEarnings).add(giftEarnings);
        BigDecimal previousEarnings = story.getTotalCoinsEarned();

        // Update story's total coins earned
        story.setTotalCoinsEarned(totalEarnings);
        storyRepository.save(story);

        log.info("✅ Recalculated earnings for story {}: {} coins (was {} coins)", 
                storyId, totalEarnings, previousEarnings);

        // Return detailed breakdown
        Map<String, Object> result = new HashMap<>();
        result.put("storyId", storyId);
        result.put("storyTitle", story.getTitle());
        result.put("previousEarnings", previousEarnings);
        result.put("newEarnings", totalEarnings);
        result.put("breakdown", Map.of(
                "chapterPurchases", chapterEarnings,
                "bookPurchases", bookEarnings,
                "gifts", giftEarnings
        ));
        result.put("message", "Story earnings recalculated successfully");

        return result;
    }
}