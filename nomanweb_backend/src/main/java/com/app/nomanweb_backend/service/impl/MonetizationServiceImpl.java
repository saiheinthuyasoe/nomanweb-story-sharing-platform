package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.monetization.*;
import com.app.nomanweb_backend.dto.refund.RefundTransactionResponse;
import com.app.nomanweb_backend.entity.*;
import com.app.nomanweb_backend.repository.*;
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
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageImpl;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonetizationServiceImpl implements MonetizationService {

    private final GiftRepository giftRepository;
    private final GiftTransactionRepository giftTransactionRepository;
    private final ChapterPurchaseRepository chapterPurchaseRepository;
    private final BookPurchaseRepository bookPurchaseRepository;
    private final CoinTransactionRepository coinTransactionRepository;
    private final ChapterRefundRepository chapterRefundRepository;

    private final UserRepository userRepository;
    private final ChapterRepository chapterRepository;
    private final StoryRepository storyRepository;
    private final NotificationService notificationService;

    @Override
    public List<GiftResponse> getAvailableGifts() {
        return giftRepository.findActiveGifts().stream()
                .map(this::convertToGiftResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public GiftTransactionResponse sendGift(User sender, SendGiftRequest request) {
        // Validate recipient
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        // Determine gift details and cost
        Gift gift = null;
        BigDecimal totalCost;
        String giftName;
        String giftDescription;

        if (request.getCustomAmount() != null) {
            // Custom coin amount gift
            totalCost = request.getCustomAmount().multiply(new BigDecimal(request.getQuantity()));
            giftName = "Custom Gift";
            giftDescription = "Custom coin gift";
        } else if (request.getGiftId() != null && request.getGiftId().startsWith("emoji_")) {
            // Emoji gift - handle predefined emoji costs
            String emojiType = request.getGiftId().replace("emoji_", "");
            BigDecimal emojiCost = getEmojiGiftCost(emojiType);
            totalCost = emojiCost.multiply(new BigDecimal(request.getQuantity()));
            giftName = getEmojiGiftName(emojiType);
            giftDescription = getEmojiGiftDescription(emojiType);
        } else {
            // Predefined gift from database
            try {
                gift = giftRepository.findById(UUID.fromString(request.getGiftId()))
                        .orElseThrow(() -> new RuntimeException("Gift not found"));

                if (!gift.isActive()) {
                    throw new RuntimeException("Gift is not available");
                }

                totalCost = gift.getCoinCost().multiply(new BigDecimal(request.getQuantity()));
                giftName = gift.getName();
                giftDescription = gift.getDescription();
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid gift ID format");
            }
        }

        // Check sender has enough coins
        if (!sender.hasEnoughCoins(totalCost)) {
            throw new RuntimeException("Insufficient coins");
        }

        // Get story and chapter if provided
        Story story = null;
        Chapter chapter = null;

        if (request.getStoryId() != null) {
            story = storyRepository.findById(request.getStoryId())
                    .orElseThrow(() -> new RuntimeException("Story not found"));
        }

        if (request.getChapterId() != null) {
            chapter = chapterRepository.findById(request.getChapterId())
                    .orElseThrow(() -> new RuntimeException("Chapter not found"));
        }

        // Deduct coins from sender
        deductCoins(sender, totalCost, "Gift sent: " + giftName + " x" + request.getQuantity());

        // Add earnings to recipient (100% of gift value - no platform fee)
        BigDecimal recipientEarnings = totalCost;
        addCoins(recipient, recipientEarnings, "Gift received: " + giftName + " x" + request.getQuantity());

        // Update story's total coins earned if gift is for a story
        if (story != null) {
            story.addCoinsEarned(totalCost);
            storyRepository.save(story);
        }

        // Create gift transaction
        GiftTransaction giftTransaction = GiftTransaction.builder()
                .gift(gift) // Can be null for custom/emoji gifts
                .sender(sender)
                .recipient(recipient)
                .story(story)
                .chapter(chapter)
                .quantity(request.getQuantity())
                .totalCoins(totalCost)
                .message(request.getMessage())
                .build();

        giftTransaction = giftTransactionRepository.save(giftTransaction);

        // Send notification to recipient
        try {
            notificationService.createNotification(
                    recipient.getId(),
                    Notification.NotificationType.GIFT_RECEIVED,
                    "Gift Received",
                    sender.getDisplayNameOrUsername() + " sent you " + giftName,
                    Notification.RelatedType.GIFT,
                    giftTransaction.getId());
        } catch (Exception e) {
            log.warn("Failed to send gift notification", e);
        }

        return convertToGiftTransactionResponse(giftTransaction);
    }

    @Override
    public Page<GiftTransactionResponse> getReceivedGifts(User user, Pageable pageable) {
        Page<GiftTransaction> transactions = giftTransactionRepository.findByRecipientOrderByCreatedAtDesc(user,
                pageable);
        return transactions.map(this::convertToGiftTransactionResponse);
    }

    @Override
    public Page<GiftTransactionResponse> getSentGifts(User user, Pageable pageable) {
        Page<GiftTransaction> transactions = giftTransactionRepository.findBySenderOrderByCreatedAtDesc(user, pageable);
        return transactions.map(this::convertToGiftTransactionResponse);
    }

    @Override
    public boolean canAccessChapter(User user, UUID chapterId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new RuntimeException("Chapter not found"));

        // Check if story is published
        if (chapter.getStory().getPublishStatus() != Story.PublishStatus.PUBLISHED) {
            return false;
        }

        // Free chapters are always accessible
        if (chapter.getIsFree()) {
            return true;
        }

        // Check if user is the author
        if (chapter.getStory().getAuthor().getId().equals(user.getId())) {
            return true;
        }

        // Check if user has purchased the chapter directly (active, not refunded)
        java.util.Optional<ChapterPurchase> chapterPurchase = chapterPurchaseRepository.findByUserAndChapter(user,
                chapter);
        if (chapterPurchase.isPresent() && chapterPurchase.get().isActive()) {
            return true; // An active chapter purchase grants access.
        }

        // Check if user has purchased the whole book (active, not refunded)
        List<BookPurchase> userBookPurchases = bookPurchaseRepository.findByUserAndStoryOrderByPurchasedAtDesc(user,
                chapter.getStory());
        if (!userBookPurchases.isEmpty()) {
            BookPurchase mostRecentBookPurchase = userBookPurchases.get(0);
            if (mostRecentBookPurchase.isActive()) {
                // For WHOLE_BOOK pricing, check if there's a chapter limit from previous
                // pricing changes
                if (chapter.getStory().getPricingType() == Story.PricingType.WHOLE_BOOK) {
                    // If chaptersAtPurchase is set, respect the limit (user bought before pricing
                    // change)
                    if (mostRecentBookPurchase.getChaptersAtPurchase() != null) {
                        return chapter.getChapterNumber() <= mostRecentBookPurchase.getChaptersAtPurchase();
                    }
                    // If no limit is set, grant access to all chapters (normal whole book purchase)
                    return true;
                }
                // For PAID_PER_CHAPTER, check if the chapter existed at the time of purchase.
                if (chapter.getStory().getPricingType() == Story.PricingType.PAID_PER_CHAPTER) {
                    if (mostRecentBookPurchase.getChaptersAtPurchase() != null &&
                            chapter.getChapterNumber() <= mostRecentBookPurchase.getChaptersAtPurchase()) {
                        return true;
                    }
                }
            }
        }

        // For WHOLE_BOOK pricing: Grant full access to users who previously bought
        // individual chapters
        // This handles the case where pricing changed from PAID_PER_CHAPTER to
        // WHOLE_BOOK
        if (chapter.getStory().getPricingType() == Story.PricingType.WHOLE_BOOK) {
            List<ChapterPurchase> userChapterPurchases = chapterPurchaseRepository.findByUserAndStory(user,
                    chapter.getStory());
            List<ChapterPurchase> activeChapterPurchases = userChapterPurchases.stream()
                    .filter(ChapterPurchase::isActive)
                    .collect(Collectors.toList());

            // If user has ANY active chapter purchases, grant access to ALL chapters
            // This ensures fairness when pricing changes from PAID_PER_CHAPTER to
            // WHOLE_BOOK
            if (!activeChapterPurchases.isEmpty()) {
                log.info("User {} has {} active chapter purchases for WHOLE_BOOK story {}, granting full access.",
                        user.getId(), activeChapterPurchases.size(), chapter.getStory().getId());
                return true;
            }
        }

        // For WHOLE_BOOK pricing: Check if user has a ChapterRefund record for this
        // specific chapter
        // This ensures users who received a proportional refund for an unpublished
        // chapter regain access if it's republished.
        if (chapter.getStory().getPricingType() == Story.PricingType.WHOLE_BOOK) {
            if (chapterRefundRepository.existsByUserAndChapter(user, chapter)) {
                log.info("User {} has a refund record for chapter {}, granting access.", user.getId(), chapter.getId());
                return true;
            }
        }

        // Note: For PAID_PER_CHAPTER pricing, ChapterRefund records do NOT grant access
        // to republished content - users must repurchase after refunds and republishing

        return false; // No active (non-refunded) purchases found
    }

    @Transactional(readOnly = true)
    public boolean hasUserPurchasedChapter(UUID chapterId, UUID userId) {
        Chapter chapter = chapterRepository.findById(chapterId).orElse(null);
        User user = userRepository.findById(userId).orElse(null);

        if (chapter == null || user == null) {
            return false;
        }

        // Check if user has purchased this chapter (active, not refunded)
        java.util.Optional<ChapterPurchase> chapterPurchase = chapterPurchaseRepository.findByUserAndChapter(user,
                chapter);
        if (chapterPurchase.isPresent() && chapterPurchase.get().isActive()) {
            return true;
        }

        // Also check if user purchased the whole book (active, not refunded)
        List<BookPurchase> userBookPurchases = bookPurchaseRepository
                .findByUserAndStoryOrderByPurchasedAtDesc(user, chapter.getStory());
        if (!userBookPurchases.isEmpty()) {
            BookPurchase mostRecentBookPurchase = userBookPurchases.get(0);
            if (mostRecentBookPurchase.isActive()) {
                // For WHOLE_BOOK, check if there's a chapter limit from previous pricing
                // changes
                if (chapter.getStory().getPricingType() == Story.PricingType.WHOLE_BOOK) {
                    // If chaptersAtPurchase is set, respect the limit (user bought before pricing
                    // change)
                    if (mostRecentBookPurchase.getChaptersAtPurchase() != null) {
                        return chapter.getChapterNumber() <= mostRecentBookPurchase.getChaptersAtPurchase();
                    }
                    // If no limit is set, grant access to all chapters (normal whole book purchase)
                    return true;
                }
                // For PAID_PER_CHAPTER, check if the chapter existed at the time of purchase.
                if (chapter.getStory().getPricingType() == Story.PricingType.PAID_PER_CHAPTER) {
                    if (mostRecentBookPurchase.getChaptersAtPurchase() != null &&
                            chapter.getChapterNumber() <= mostRecentBookPurchase.getChaptersAtPurchase()) {
                        return true;
                    }
                }
            }
        }

        // For WHOLE_BOOK pricing: Check if user has a ChapterRefund record for this
        // specific chapter
        // This ensures users who received a proportional refund for an unpublished
        // chapter regain access if it's republished.
        if (chapter.getStory().getPricingType() == Story.PricingType.WHOLE_BOOK) {
            if (chapterRefundRepository.existsByUserAndChapter(user, chapter)) {
                return true;
            }
        }

        // Note: For PAID_PER_CHAPTER pricing, ChapterRefund records do NOT grant access
        // to republished content - users must repurchase after refunds and republishing

        return false;
    }

    @Override
    @Transactional
    public GiftTransactionResponse purchaseChapter(User user, PurchaseChapterRequest request) {
        Chapter chapter = chapterRepository.findById(request.getChapterId())
                .orElseThrow(() -> new RuntimeException("Chapter not found"));

        // Check if story is published
        if (chapter.getStory().getPublishStatus() != Story.PublishStatus.PUBLISHED) {
            throw new RuntimeException("Chapter is not available for purchase");
        }

        // Check if chapter requires payment
        if (chapter.getIsFree()) {
            throw new RuntimeException("Chapter is free to read");
        }

        // Check if user is the author
        if (chapter.getStory().getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("Authors can read their own chapters for free");
        }

        // Check if already purchased and not refunded (either directly or through whole
        // book)
        java.util.Optional<ChapterPurchase> existingChapterPurchase = chapterPurchaseRepository
                .findByUserAndChapter(user, chapter);
        if (existingChapterPurchase.isPresent() && existingChapterPurchase.get().isActive()) {
            throw new RuntimeException("Chapter already purchased");
        }
        // If refunded, allow repurchase

        // Check if user has purchased the whole book
        List<BookPurchase> existingBookPurchases = bookPurchaseRepository.findByUserAndStoryOrderByPurchasedAtDesc(user,
                chapter.getStory());
        if (!existingBookPurchases.isEmpty()) {
            BookPurchase mostRecentBookPurchase = existingBookPurchases.get(0);
            if (mostRecentBookPurchase.isActive()) {
                // If story is currently WHOLE_BOOK, check if user has access to this chapter
                if (chapter.getStory().getPricingType() == Story.PricingType.WHOLE_BOOK) {
                    // If chaptersAtPurchase is set, respect the limit (user bought before pricing
                    // change)
                    if (mostRecentBookPurchase.getChaptersAtPurchase() != null) {
                        if (chapter.getChapterNumber() <= mostRecentBookPurchase.getChaptersAtPurchase()) {
                            return GiftTransactionResponse.builder()
                                    .id(mostRecentBookPurchase.getId())
                                    .totalCoins(BigDecimal.ZERO) // No charge since they already own the book
                                    .createdAt(LocalDateTime.now())
                                    .build();
                        }
                        // Chapter is beyond their purchase limit, they need to buy it
                    } else {
                        // No limit set, they have access to all chapters (normal whole book purchase)
                        return GiftTransactionResponse.builder()
                                .id(mostRecentBookPurchase.getId())
                                .totalCoins(BigDecimal.ZERO) // No charge since they already own the book
                                .createdAt(LocalDateTime.now())
                                .build();
                    }
                }

                // If story is currently PAID_PER_CHAPTER, user only has access to chapters that
                // existed at purchase time
                if (chapter.getStory().getPricingType() == Story.PricingType.PAID_PER_CHAPTER) {
                    // Check if this chapter existed at the time of book purchase
                    if (mostRecentBookPurchase.getChaptersAtPurchase() != null &&
                            chapter.getChapterNumber() <= mostRecentBookPurchase.getChaptersAtPurchase()) {
                        throw new RuntimeException(
                                "You already have access to this chapter through your book purchase");
                    }
                }
            }
        }
        // For PAID_PER_CHAPTER pricing: If refunded, allow repurchase
        // For WHOLE_BOOK pricing: Active book purchase should grant access even after
        // individual chapter refunds

        // Check if user has enough coins
        if (!user.hasEnoughCoins(chapter.getCoinPrice())) {
            throw new RuntimeException("Insufficient coins");
        }

        // Deduct coins from user
        log.info("Deducting {} coins from user {} for chapter purchase: {}",
                chapter.getCoinPrice(), user.getId(), chapter.getId());
        deductCoins(user, chapter.getCoinPrice(), "Chapter purchase: " + chapter.getTitle(),
                chapter.getId(), CoinTransaction.ReferenceType.CHAPTER);

        // Add earnings to author (70% of chapter price)
        BigDecimal authorEarnings = chapter.getCoinPrice().multiply(new BigDecimal("0.70"));
        addCoins(chapter.getStory().getAuthor(), authorEarnings,
                "Chapter sale: " + chapter.getTitle());

        // Update story's total coins earned (70% of chapter price)
        Story story = chapter.getStory();
        story.addCoinsEarned(authorEarnings);
        storyRepository.save(story);

        // Create purchase record
        ChapterPurchase purchase = ChapterPurchase.builder()
                .user(user)
                .chapter(chapter)
                .story(chapter.getStory())
                .coinsSpent(chapter.getCoinPrice())
                .build();

        chapterPurchaseRepository.save(purchase);

        // Send notification to author
        try {
            notificationService.createNotification(
                    chapter.getStory().getAuthor().getId(),
                    Notification.NotificationType.SYSTEM,
                    "Chapter Purchased",
                    user.getDisplayNameOrUsername() + " purchased your chapter: " + chapter.getTitle(),
                    Notification.RelatedType.CHAPTER,
                    chapter.getId());
        } catch (Exception e) {
            log.warn("Failed to send purchase notification", e);
        }

        // Return a dummy response (since we're returning GiftTransactionResponse for
        // consistency)
        return GiftTransactionResponse.builder()
                .id(purchase.getId())
                .totalCoins(chapter.getCoinPrice())
                .createdAt(purchase.getPurchasedAt())
                .build();
    }

    @Override
    public Page<GiftTransactionResponse> getPurchaseHistory(User user, Pageable pageable) {
        // Get chapter purchases
        Page<ChapterPurchase> chapterPurchases = chapterPurchaseRepository.findByUserOrderByPurchasedAtDesc(user,
                pageable);

        // Get book purchases
        Page<BookPurchase> bookPurchases = bookPurchaseRepository.findByUserOrderByPurchasedAtDesc(user, pageable);

        // Combine and sort all purchases by date
        List<GiftTransactionResponse> allPurchases = new ArrayList<>();

        // Add chapter purchases
        chapterPurchases.getContent().forEach(purchase -> {
            allPurchases.add(GiftTransactionResponse.builder()
                    .id(purchase.getId())
                    .totalCoins(purchase.getCoinsSpent())
                    .createdAt(purchase.getPurchasedAt())
                    .chapter(GiftTransactionResponse.ChapterSummary.builder()
                            .id(purchase.getChapter().getId())
                            .title(purchase.getChapter().getTitle())
                            .chapterNumber(purchase.getChapter().getChapterNumber())
                            .build())
                    .story(GiftTransactionResponse.StorySummary.builder()
                            .id(purchase.getStory().getId())
                            .title(purchase.getStory().getTitle())
                            .coverImageUrl(purchase.getStory().getCoverImageUrl())
                            .pricingType(purchase.getStory().getPricingType().name())
                            .build())
                    .build());
        });

        // Add book purchases
        bookPurchases.getContent().forEach(purchase -> {
            allPurchases.add(GiftTransactionResponse.builder()
                    .id(purchase.getId())
                    .totalCoins(purchase.getCoinsSpent())
                    .createdAt(purchase.getPurchasedAt())
                    .chaptersAtPurchase(purchase.getChaptersAtPurchase())
                    .story(GiftTransactionResponse.StorySummary.builder()
                            .id(purchase.getStory().getId())
                            .title(purchase.getStory().getTitle())
                            .coverImageUrl(purchase.getStory().getCoverImageUrl())
                            .pricingType(purchase.getStory().getPricingType().name())
                            .build())
                    .build());
        });

        // Sort by creation date (most recent first)
        allPurchases.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        // Apply pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allPurchases.size());
        List<GiftTransactionResponse> pageContent = allPurchases.subList(start, end);

        return new PageImpl<>(pageContent, pageable, allPurchases.size());
    }

    @Override
    public boolean canAccessBook(User user, UUID storyId) {
        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        // Check if story is published
        if (story.getPublishStatus() != Story.PublishStatus.PUBLISHED) {
            return false;
        }

        // Free stories are always accessible
        if (story.getPricingType() == Story.PricingType.FREE) {
            return true;
        }

        // Check if user is the author
        if (story.getAuthor().getId().equals(user.getId())) {
            return true;
        }

        // For WHOLE_BOOK pricing, check if user has a non-refunded (active) purchase
        if (story.getPricingType() == Story.PricingType.WHOLE_BOOK) {
            List<BookPurchase> bookPurchases = bookPurchaseRepository.findByUserAndStoryOrderByPurchasedAtDesc(user,
                    story);
            if (!bookPurchases.isEmpty()) {
                // Get the most recent book purchase and check if it's active (not refunded)
                BookPurchase mostRecentBookPurchase = bookPurchases.get(0);
                if (mostRecentBookPurchase.isActive()) {
                    return true; // User has valid active book purchase
                }
            }
        }

        // Note: ChapterRefund records do NOT grant access to republished content
        // Users must repurchase after refunds and republishing

        // For PAID_PER_CHAPTER pricing, book access is not applicable
        return false;
    }

    @Override
    @Transactional
    public GiftTransactionResponse purchaseBook(User user, PurchaseBookRequest request) {
        Story story = storyRepository.findById(request.getStoryId())
                .orElseThrow(() -> new RuntimeException("Story not found"));

        // Check if story is published
        if (story.getPublishStatus() != Story.PublishStatus.PUBLISHED) {
            throw new RuntimeException("Story is not available for purchase");
        }

        // Check if story is available for whole book purchase
        if (story.getPricingType() != Story.PricingType.WHOLE_BOOK) {
            throw new RuntimeException("Story is not available for whole book purchase");
        }

        // Check if user is the author
        if (story.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("Authors can read their own stories for free");
        }

        // Check if already purchased
        // Use the new method to handle multiple book purchases properly
        List<BookPurchase> bookPurchases = bookPurchaseRepository.findByUserAndStoryOrderByPurchasedAtDesc(user, story);
        if (!bookPurchases.isEmpty()) {
            // Check the most recent purchase
            BookPurchase mostRecentPurchase = bookPurchases.get(0);
            log.info(
                    "DEBUG: BookPurchase for user {} story {}: id={}, isActive={}, isRefunded={}, purchasedAt={}, story.publishedAt={}",
                    user.getId(), story.getId(), mostRecentPurchase.getId(), mostRecentPurchase.isActive(),
                    mostRecentPurchase.getIsRefunded(), mostRecentPurchase.getPurchasedAt(), story.getPublishedAt());
            // Only block if the most recent purchase is active (not refunded) AND was made
            // after or at the same time as the current publishedAt
            if (mostRecentPurchase.isActive() && story.getPublishedAt() != null &&
                    !mostRecentPurchase.getPurchasedAt().isBefore(story.getPublishedAt())) {
                throw new RuntimeException("Book already purchased");
            }
            // If purchase was refunded or made before current publish cycle, allow
            // repurchase
        }

        // Check if user has purchased any chapters from this story
        List<ChapterPurchase> existingChapterPurchases = chapterPurchaseRepository.findByUserAndStory(user, story);

        for (ChapterPurchase purchase : existingChapterPurchases) {
            // Only block if the chapter purchase is active (not refunded) AND was made
            // after or at the same time as current publish date
            if (purchase.getUser().getId().equals(user.getId()) && purchase.isActive()) {
                // Check if the chapter purchase was made after or at the same time as the
                // current publish date
                if (story.getPublishedAt() != null && !purchase.getPurchasedAt().isBefore(story.getPublishedAt())) {
                    throw new RuntimeException(
                            "You already have access to some chapters from this story. Book purchase will give you access to all chapters.");
                }
                // If chapter purchase was made before current publish cycle, allow book
                // purchase
            }
        }

        // Check if user has enough coins
        if (!user.hasEnoughCoins(story.getBookPrice())) {
            throw new RuntimeException("Insufficient coins");
        }

        // Deduct coins from user
        deductCoins(user, story.getBookPrice(), "Book purchase: " + story.getTitle(),
                story.getId(), CoinTransaction.ReferenceType.STORY);

        // Add earnings to author (70% of book price)
        BigDecimal authorEarnings = story.getBookPrice().multiply(new BigDecimal("0.70"));
        addCoins(story.getAuthor(), authorEarnings, "Book sale: " + story.getTitle());

        // Update story's total coins earned (70% of book price)
        story.addCoinsEarned(authorEarnings);
        storyRepository.save(story);

        // Count how many chapters exist at the time of purchase
        long chaptersAtPurchase = chapterRepository.countByStoryAndStatusAndCreatedAtBefore(
                story, Chapter.Status.PUBLISHED, LocalDateTime.now());

        // Create purchase record
        BookPurchase purchase = BookPurchase.builder()
                .user(user)
                .story(story)
                .coinsSpent(story.getBookPrice())
                .chaptersAtPurchase((int) chaptersAtPurchase)
                .build();

        bookPurchaseRepository.save(purchase);

        // Send notification to author
        try {
            notificationService.createNotification(
                    story.getAuthor().getId(),
                    Notification.NotificationType.SYSTEM,
                    "Book Purchased",
                    user.getDisplayNameOrUsername() + " purchased your book: " + story.getTitle(),
                    Notification.RelatedType.STORY,
                    story.getId());
        } catch (Exception e) {
            log.warn("Failed to send book purchase notification", e);
        }

        // Return response (reusing GiftTransactionResponse for consistency)
        return GiftTransactionResponse.builder()
                .id(purchase.getId())
                .totalCoins(purchase.getCoinsSpent())
                .createdAt(purchase.getPurchasedAt())
                .story(convertToStorySummary(story))
                .build();
    }

    @Override
    @Transactional
    public void addCoins(User user, BigDecimal amount, String description) {
        BigDecimal balanceBefore = user.getCoinBalance();
        user.addCoins(amount);
        userRepository.save(user);

        // Create transaction record
        CoinTransaction transaction = CoinTransaction.builder()
                .user(user)
                .transactionType(CoinTransaction.TransactionType.EARNING)
                .amount(amount)
                .balanceBefore(balanceBefore)
                .balanceAfter(user.getCoinBalance())
                .description(description)
                .status(CoinTransaction.Status.COMPLETED)
                .build();

        coinTransactionRepository.save(transaction);
    }

    @Override
    @Transactional
    public void deductCoins(User user, BigDecimal amount, String description) {
        deductCoins(user, amount, description, null, null);
    }

    @Transactional
    public void deductCoins(User user, BigDecimal amount, String description, UUID referenceId,
            CoinTransaction.ReferenceType referenceType) {
        BigDecimal balanceBefore = user.getCoinBalance();
        user.subtractCoins(amount);
        userRepository.save(user);

        // Create transaction record
        CoinTransaction transaction = CoinTransaction.builder()
                .user(user)
                .transactionType(CoinTransaction.TransactionType.PURCHASE)
                .amount(amount)
                .balanceBefore(balanceBefore)
                .balanceAfter(user.getCoinBalance())
                .description(description)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .status(CoinTransaction.Status.COMPLETED)
                .build();

        transaction = coinTransactionRepository.save(transaction);
        log.info("Created CoinTransaction: id={}, userId={}, referenceId={}, referenceType={}, amount={}",
                transaction.getId(), user.getId(), referenceId, referenceType, amount);
    }

    @Override
    public BigDecimal getUserCoinBalance(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getCoinBalance();
    }

    @Override
    public RevenueAnalyticsResponse getUserRevenue(User user) {
        // Calculate total earnings from gifts and chapter sales
        BigDecimal giftEarnings = giftTransactionRepository.calculateTotalEarningsForRecipient(user.getId());
        BigDecimal chapterEarnings = chapterPurchaseRepository.calculateTotalEarningsForAuthor(user.getId());
        BigDecimal totalEarnings = giftEarnings.add(chapterEarnings);

        // Calculate current and last month earnings
        LocalDateTime now = LocalDateTime.now();
        YearMonth currentMonth = YearMonth.from(now);
        YearMonth lastMonth = currentMonth.minusMonths(1);

        BigDecimal currentMonthGifts = giftTransactionRepository.calculateEarningsForPeriod(
                user.getId(), currentMonth.atDay(1).atStartOfDay(), currentMonth.atEndOfMonth().atTime(23, 59, 59));
        BigDecimal currentMonthChapters = chapterPurchaseRepository.calculateEarningsForPeriod(
                user.getId(), currentMonth.atDay(1).atStartOfDay(), currentMonth.atEndOfMonth().atTime(23, 59, 59));
        BigDecimal currentMonthEarnings = currentMonthGifts.add(currentMonthChapters);

        BigDecimal lastMonthGifts = giftTransactionRepository.calculateEarningsForPeriod(
                user.getId(), lastMonth.atDay(1).atStartOfDay(), lastMonth.atEndOfMonth().atTime(23, 59, 59));
        BigDecimal lastMonthChapters = chapterPurchaseRepository.calculateEarningsForPeriod(
                user.getId(), lastMonth.atDay(1).atStartOfDay(), lastMonth.atEndOfMonth().atTime(23, 59, 59));
        BigDecimal lastMonthEarnings = lastMonthGifts.add(lastMonthChapters);

        return RevenueAnalyticsResponse.builder()
                .totalEarnings(totalEarnings)
                .totalChapterSales(chapterEarnings)
                .totalGiftEarnings(giftEarnings)
                .currentMonthEarnings(currentMonthEarnings)
                .lastMonthEarnings(lastMonthEarnings)
                .build();
    }

    @Override
    public BigDecimal calculateTotalEarnings(User user) {
        BigDecimal giftEarnings = giftTransactionRepository.calculateTotalEarningsForRecipient(user.getId());
        BigDecimal chapterEarnings = chapterPurchaseRepository.calculateTotalEarningsForAuthor(user.getId());
        return giftEarnings.add(chapterEarnings);
    }

    @Override
    public BigDecimal calculateMonthlyEarnings(User user, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime startDate = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59);

        BigDecimal giftEarnings = giftTransactionRepository.calculateEarningsForPeriod(user.getId(), startDate,
                endDate);
        BigDecimal chapterEarnings = chapterPurchaseRepository.calculateEarningsForPeriod(user.getId(), startDate,
                endDate);

        return giftEarnings.add(chapterEarnings);
    }

    // Helper methods
    private GiftResponse convertToGiftResponse(Gift gift) {
        return GiftResponse.builder()
                .id(gift.getId())
                .name(gift.getName())
                .description(gift.getDescription())
                .iconUrl(gift.getIconUrl())
                .coinCost(gift.getCoinCost())
                .isActive(gift.getIsActive())
                .createdAt(gift.getCreatedAt())
                .build();
    }

    private GiftTransactionResponse convertToGiftTransactionResponse(GiftTransaction transaction) {
        return GiftTransactionResponse.builder()
                .id(transaction.getId())
                .gift(transaction.getGift() != null ? convertToGiftResponse(transaction.getGift()) : null)
                .sender(convertToUserSummary(transaction.getSender()))
                .recipient(convertToUserSummary(transaction.getRecipient()))
                .story(transaction.getStory() != null ? convertToStorySummary(transaction.getStory()) : null)
                .chapter(transaction.getChapter() != null ? convertToChapterSummary(transaction.getChapter()) : null)
                .quantity(transaction.getQuantity())
                .totalCoins(transaction.getTotalCoins())
                .message(transaction.getMessage())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    private GiftTransactionResponse.UserSummary convertToUserSummary(User user) {
        return GiftTransactionResponse.UserSummary.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }

    private GiftTransactionResponse.StorySummary convertToStorySummary(Story story) {
        return GiftTransactionResponse.StorySummary.builder()
                .id(story.getId())
                .title(story.getTitle())
                .coverImageUrl(story.getCoverImageUrl())
                .build();
    }

    private GiftTransactionResponse.ChapterSummary convertToChapterSummary(Chapter chapter) {
        return GiftTransactionResponse.ChapterSummary.builder()
                .id(chapter.getId())
                .title(chapter.getTitle())
                .chapterNumber(chapter.getChapterNumber())
                .build();
    }

    // Helper methods for emoji gifts
    private BigDecimal getEmojiGiftCost(String emojiType) {
        return switch (emojiType) {
            case "heart" -> new BigDecimal("1");
            case "star" -> new BigDecimal("5");
            case "crown" -> new BigDecimal("10");
            case "diamond" -> new BigDecimal("25");
            case "trophy" -> new BigDecimal("50");
            case "fire" -> new BigDecimal("15");
            case "rocket" -> new BigDecimal("30");
            case "rainbow" -> new BigDecimal("20");
            default -> new BigDecimal("1");
        };
    }

    private String getEmojiGiftName(String emojiType) {
        return switch (emojiType) {
            case "heart" -> "Heart";
            case "star" -> "Star";
            case "crown" -> "Crown";
            case "diamond" -> "Diamond";
            case "trophy" -> "Trophy";
            case "fire" -> "Fire";
            case "rocket" -> "Rocket";
            case "rainbow" -> "Rainbow";
            default -> "Gift";
        };
    }

    private String getEmojiGiftDescription(String emojiType) {
        return switch (emojiType) {
            case "heart" -> "Show your love";
            case "star" -> "This story shines";
            case "crown" -> "You are the king/queen";
            case "diamond" -> "Precious like a diamond";
            case "trophy" -> "You deserve this trophy";
            case "fire" -> "This is fire!";
            case "rocket" -> "To the moon!";
            case "rainbow" -> "Magical content";
            default -> "A special gift";
        };
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EarnedMoneyResponse> getUserEarnings(User user, Pageable pageable) {
        List<EarnedMoneyResponse> earnings = new ArrayList<>();

        // Get chapter purchase earnings
        List<ChapterPurchase> chapterPurchases = chapterPurchaseRepository
                .findByChapter_Story_AuthorOrderByCreatedAtDesc(user);
        for (ChapterPurchase purchase : chapterPurchases) {
            EarnedMoneyResponse earning = EarnedMoneyResponse.builder()
                    .id(purchase.getId())
                    .transactionType("chapter_purchase")
                    .amount(purchase.getCoinsSpent())
                    .readerName(purchase.getUser().getDisplayName() != null ? purchase.getUser().getDisplayName()
                            : purchase.getUser().getUsername())
                    .readerUsername(purchase.getUser().getUsername())
                    .storyTitle(purchase.getStory().getTitle())
                    .chapterTitle(purchase.getChapter().getTitle())
                    .chapterNumber(purchase.getChapter().getChapterNumber())
                    .createdAt(purchase.getPurchasedAt())
                    .commission(BigDecimal.valueOf(0.30)) // 30% platform commission
                    .netEarnings(purchase.getCoinsSpent().multiply(BigDecimal.valueOf(0.70))) // 70% to author
                    .build();
            earnings.add(earning);
        }

        // Get book purchase earnings
        List<BookPurchase> bookPurchases = bookPurchaseRepository.findByStory_AuthorOrderByCreatedAtDesc(user);
        for (BookPurchase purchase : bookPurchases) {
            EarnedMoneyResponse earning = EarnedMoneyResponse.builder()
                    .id(purchase.getId())
                    .transactionType("story_purchase")
                    .amount(purchase.getCoinsSpent())
                    .readerName(purchase.getUser().getDisplayName() != null ? purchase.getUser().getDisplayName()
                            : purchase.getUser().getUsername())
                    .readerUsername(purchase.getUser().getUsername())
                    .storyTitle(purchase.getStory().getTitle())
                    .chapterTitle(null)
                    .chapterNumber(null)
                    .createdAt(purchase.getPurchasedAt())
                    .commission(BigDecimal.valueOf(0.30)) // 30% platform commission
                    .netEarnings(purchase.getCoinsSpent().multiply(BigDecimal.valueOf(0.70))) // 70% to author
                    .build();
            earnings.add(earning);
        }

        // Sort by creation date descending
        earnings.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        // Apply pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), earnings.size());
        List<EarnedMoneyResponse> paginatedEarnings = earnings.subList(start, end);

        return new PageImpl<>(paginatedEarnings, pageable, earnings.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseHistoryResponse> getUserPurchaseHistory(User user, Pageable pageable) {
        // Get chapter purchases
        Page<ChapterPurchase> chapterPurchases = chapterPurchaseRepository.findByUserOrderByPurchasedAtDesc(user,
                pageable);

        // Get book purchases
        Page<BookPurchase> bookPurchases = bookPurchaseRepository.findByUserOrderByPurchasedAtDesc(user, pageable);

        // Combine and sort all purchases by date
        List<PurchaseHistoryResponse> allPurchases = new ArrayList<>();

        // Add chapter purchases
        chapterPurchases.getContent().forEach(purchase -> {
            allPurchases.add(PurchaseHistoryResponse.builder()
                    .id(purchase.getId())
                    .purchaseType("chapter")
                    .storyId(purchase.getStory().getId())
                    .storyTitle(purchase.getStory().getTitle())
                    .storyAuthor(purchase.getStory().getAuthor().getDisplayName() != null
                            ? purchase.getStory().getAuthor().getDisplayName()
                            : purchase.getStory().getAuthor().getUsername())
                    .chapterId(purchase.getChapter().getId())
                    .chapterTitle(purchase.getChapter().getTitle())
                    .chapterNumber(purchase.getChapter().getChapterNumber())
                    .amount(purchase.getCoinsSpent())
                    .createdAt(purchase.getPurchasedAt())
                    .status(purchase.getIsRefunded() ? "refunded" : "completed")
                    .build());
        });

        // Add book purchases
        bookPurchases.getContent().forEach(purchase -> {
            allPurchases.add(PurchaseHistoryResponse.builder()
                    .id(purchase.getId())
                    .purchaseType("book")
                    .storyId(purchase.getStory().getId())
                    .storyTitle(purchase.getStory().getTitle())
                    .storyAuthor(purchase.getStory().getAuthor().getDisplayName() != null
                            ? purchase.getStory().getAuthor().getDisplayName()
                            : purchase.getStory().getAuthor().getUsername())
                    .amount(purchase.getCoinsSpent())
                    .createdAt(purchase.getPurchasedAt())
                    .status(purchase.getIsRefunded() ? "refunded" : "completed")
                    .build());
        });

        // Sort by creation date (most recent first)
        allPurchases.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        // Apply pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allPurchases.size());
        List<PurchaseHistoryResponse> pageContent = allPurchases.subList(start, end);

        return new PageImpl<>(pageContent, pageable, allPurchases.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RefundTransactionResponse> getRefundsEarned(User user, Pageable pageable) {
        Page<ChapterRefund> chapterRefunds = chapterRefundRepository.findByUserOrderByRefundedAtDesc(user, pageable);
        
        return chapterRefunds.map(this::convertToRefundTransactionResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RefundTransactionResponse> getRefundsPaid(User user, Pageable pageable) {
        Page<ChapterRefund> chapterRefunds = chapterRefundRepository.findByStoryAuthorOrderByRefundedAtDesc(user, pageable);
        
        return chapterRefunds.map(this::convertToRefundTransactionResponse);
    }

    private RefundTransactionResponse convertToRefundTransactionResponse(ChapterRefund chapterRefund) {
        return RefundTransactionResponse.builder()
                .id(chapterRefund.getId())
                .userId(chapterRefund.getUser().getId())
                .authorId(chapterRefund.getStory().getAuthor().getId())
                .storyId(chapterRefund.getStory().getId())
                .storyTitle(chapterRefund.getStory().getTitle())
                .chapterId(chapterRefund.getChapter().getId())
                .chapterTitle(chapterRefund.getChapter().getTitle())
                .chapterNumber(chapterRefund.getChapter().getChapterNumber())
                .refundType("chapter")
                .originalPurchaseType("book")
                .refundAmount(chapterRefund.getRefundAmount())
                .originalAmount(chapterRefund.getBookPurchase().getCoinsSpent())
                .refundReason(chapterRefund.getReason())
                .status("completed")
                .processedAt(chapterRefund.getRefundedAt())
                .createdAt(chapterRefund.getRefundedAt())
                .build();
    }
}