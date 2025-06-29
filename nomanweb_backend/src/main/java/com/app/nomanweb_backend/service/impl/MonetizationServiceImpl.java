package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.monetization.*;
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
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonetizationServiceImpl implements MonetizationService {

    private final GiftRepository giftRepository;
    private final GiftTransactionRepository giftTransactionRepository;
    private final ChapterPurchaseRepository chapterPurchaseRepository;
    private final CoinTransactionRepository coinTransactionRepository;
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
        // Validate gift exists and is active
        Gift gift = giftRepository.findById(request.getGiftId())
                .orElseThrow(() -> new RuntimeException("Gift not found"));

        if (!gift.isActive()) {
            throw new RuntimeException("Gift is not available");
        }

        // Validate recipient
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        // Calculate total cost
        BigDecimal totalCost = gift.getCoinCost().multiply(new BigDecimal(request.getQuantity()));

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
        deductCoins(sender, totalCost, "Gift sent: " + gift.getName() + " x" + request.getQuantity());

        // Add earnings to recipient (70% of gift value)
        BigDecimal recipientEarnings = totalCost.multiply(new BigDecimal("0.70"));
        addCoins(recipient, recipientEarnings, "Gift received: " + gift.getName() + " x" + request.getQuantity());

        // Create gift transaction
        GiftTransaction giftTransaction = GiftTransaction.builder()
                .gift(gift)
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
                    sender.getDisplayNameOrUsername() + " sent you " + gift.getName(),
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

        // Free chapters are always accessible
        if (chapter.getIsFree()) {
            return true;
        }

        // Check if user is the author
        if (chapter.getStory().getAuthor().getId().equals(user.getId())) {
            return true;
        }

        // Check if user has purchased the chapter
        return chapterPurchaseRepository.existsByUserAndChapter(user, chapter);
    }

    @Override
    @Transactional
    public GiftTransactionResponse purchaseChapter(User user, PurchaseChapterRequest request) {
        Chapter chapter = chapterRepository.findById(request.getChapterId())
                .orElseThrow(() -> new RuntimeException("Chapter not found"));

        // Check if chapter requires payment
        if (chapter.getIsFree()) {
            throw new RuntimeException("Chapter is free to read");
        }

        // Check if user is the author
        if (chapter.getStory().getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("Authors can read their own chapters for free");
        }

        // Check if already purchased
        if (chapterPurchaseRepository.existsByUserAndChapter(user, chapter)) {
            throw new RuntimeException("Chapter already purchased");
        }

        // Check if user has enough coins
        if (!user.hasEnoughCoins(chapter.getCoinPrice())) {
            throw new RuntimeException("Insufficient coins");
        }

        // Deduct coins from user
        deductCoins(user, chapter.getCoinPrice(), "Chapter purchase: " + chapter.getTitle());

        // Add earnings to author (70% of chapter price)
        BigDecimal authorEarnings = chapter.getCoinPrice().multiply(new BigDecimal("0.70"));
        addCoins(chapter.getStory().getAuthor(), authorEarnings,
                "Chapter sale: " + chapter.getTitle());

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
        Page<ChapterPurchase> purchases = chapterPurchaseRepository.findByUserOrderByPurchasedAtDesc(user, pageable);
        return purchases.map(purchase -> GiftTransactionResponse.builder()
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
                        .build())
                .build());
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
                .status(CoinTransaction.Status.COMPLETED)
                .build();

        coinTransactionRepository.save(transaction);
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
                .gift(convertToGiftResponse(transaction.getGift()))
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
}