package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.service.PurchaseProtectionService;
import com.app.nomanweb_backend.entity.*;
import com.app.nomanweb_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PurchaseProtectionServiceImpl implements PurchaseProtectionService {

        private final BookPurchaseRepository bookPurchaseRepository;
        private final ChapterPurchaseRepository chapterPurchaseRepository;
        private final StoryRepository storyRepository;
        private final ChapterRepository chapterRepository;
        private final UserRepository userRepository;

        @Override
        public boolean storyHasPurchases(UUID storyId) {
                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Story not found"));

                log.info("🔍 Checking purchases for story: {} (Title: '{}', PricingType: {})",
                                storyId, story.getTitle(), story.getPricingType());

                // Check book purchases (only active, non-refunded, and from current publish
                // cycle)
                List<BookPurchase> bookPurchases = bookPurchaseRepository
                                .findActiveByStoryOrderByPurchasedAtDesc(story);
                log.info("📚 Found {} active book purchases for story: {}", bookPurchases.size(), storyId);

                if (!bookPurchases.isEmpty() && story.getPublishedAt() != null) {
                        // Only count purchases made on or after the current publish date
                        long validBookPurchases = bookPurchases.stream()
                                        .filter(purchase -> !purchase.getPurchasedAt().isBefore(story.getPublishedAt()))
                                        .count();
                        log.info("📚 Found {} valid book purchases from current publish cycle", validBookPurchases);
                        if (validBookPurchases > 0) {
                                log.info("✅ Found valid book purchases - story has purchases: TRUE");
                                return true;
                        }
                }

                // Check chapter purchases (only active, non-refunded, and from current publish
                // cycle)
                List<ChapterPurchase> chapterPurchases = chapterPurchaseRepository
                                .findByStoryAndIsRefundedFalseOrderByPurchasedAtDesc(story);
                log.info("📖 Found {} active chapter purchases for story: {}", chapterPurchases.size(), storyId);

                if (!chapterPurchases.isEmpty() && story.getPublishedAt() != null) {
                        // Only count purchases made on or after the current publish date
                        long validChapterPurchases = chapterPurchases.stream()
                                        .filter(purchase -> !purchase.getPurchasedAt().isBefore(story.getPublishedAt()))
                                        .count();
                        log.info("📖 Found {} valid chapter purchases from current publish cycle",
                                        validChapterPurchases);
                        if (validChapterPurchases > 0) {
                                log.info("✅ Found valid chapter purchases - story has purchases: TRUE");
                                return true;
                        }
                }

                log.info("❌ No valid purchases found from current publish cycle - story has purchases: FALSE");
                return false;
        }

        @Override
        public boolean chapterHasPurchases(UUID chapterId) {
                Chapter chapter = chapterRepository.findById(chapterId)
                                .orElseThrow(() -> new RuntimeException("Chapter not found"));

                log.info("🔍 Checking purchases for chapter: {} (Title: '{}', Story: '{}', PricingType: {})",
                                chapterId, chapter.getTitle(), chapter.getStory().getTitle(),
                                chapter.getStory().getPricingType());

                Story story = chapter.getStory();

                // If story is WHOLE_BOOK pricing, check for book purchases from current publish
                // cycle
                if (story.getPricingType() == Story.PricingType.WHOLE_BOOK) {
                        List<BookPurchase> bookPurchases = bookPurchaseRepository
                                        .findActiveByStoryOrderByPurchasedAtDesc(story);
                        log.info("📚 Found {} active book purchases for story: {}", bookPurchases.size(),
                                        story.getId());

                        if (!bookPurchases.isEmpty() && story.getPublishedAt() != null) {
                                // Only count purchases made on or after the current publish date
                                long validBookPurchases = bookPurchases.stream()
                                                .filter(purchase -> !purchase.getPurchasedAt()
                                                                .isBefore(story.getPublishedAt()))
                                                .count();
                                log.info("📚 Found {} valid book purchases from current publish cycle",
                                                validBookPurchases);
                                if (validBookPurchases > 0) {
                                        log.info("✅ Found valid book purchases - chapter has purchases: TRUE");
                                        return true;
                                }
                        }
                }

                // Check for direct chapter purchases from current publish cycle (only active,
                // non-refunded)
                List<ChapterPurchase> purchases = chapterPurchaseRepository
                                .findByChapterAndIsRefundedFalseOrderByPurchasedAtDesc(chapter);
                log.info("📖 Found {} active direct chapter purchases for chapter: {}", purchases.size(), chapterId);

                if (!purchases.isEmpty() && story.getPublishedAt() != null) {
                        // Only count purchases made on or after the current publish date
                        long validChapterPurchases = purchases.stream()
                                        .filter(purchase -> !purchase.getPurchasedAt().isBefore(story.getPublishedAt()))
                                        .count();
                        log.info("📖 Found {} valid chapter purchases from current publish cycle",
                                        validChapterPurchases);
                        if (validChapterPurchases > 0) {
                                log.info("✅ Found valid chapter purchases - chapter has purchases: TRUE");
                                return true;
                        }
                }

                log.info("❌ No valid purchases found from current publish cycle - chapter has purchases: FALSE");
                return false;
        }

        @Override
        public boolean userHasPurchasedStoryAccess(UUID userId, UUID storyId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Story not found"));

                if (story.getPublishedAt() == null) {
                        return false;
                }

                // Check if user purchased the whole book (active, non-refunded)
                List<BookPurchase> bookPurchases = bookPurchaseRepository
                                .findActiveByUserAndStoryOrderByPurchasedAtDesc(user, story);
                for (BookPurchase purchase : bookPurchases) {
                        if (!purchase.getPurchasedAt().isBefore(story.getPublishedAt())) {
                                return true;
                        }
                }

                // Check if user purchased any chapters from this story (active, non-refunded)
                List<ChapterPurchase> chapterPurchases = chapterPurchaseRepository
                                .findByStoryAndIsRefundedFalseOrderByPurchasedAtDesc(story);

                for (ChapterPurchase purchase : chapterPurchases) {
                        if (purchase.getUser().getId().equals(userId) &&
                                        !purchase.getPurchasedAt().isBefore(story.getPublishedAt())) {
                                return true;
                        }
                }

                return false;
        }

        @Override
        public boolean userHasPurchasedChapter(UUID userId, UUID chapterId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                Chapter chapter = chapterRepository.findById(chapterId)
                                .orElseThrow(() -> new RuntimeException("Chapter not found"));

                Story story = chapter.getStory();
                if (story.getPublishedAt() == null) {
                        return false;
                }

                // Check if user purchased this specific chapter (active, non-refunded)
                List<ChapterPurchase> chapterPurchases = chapterPurchaseRepository
                                .findByChapterAndIsRefundedFalseOrderByPurchasedAtDesc(chapter);
                for (ChapterPurchase purchase : chapterPurchases) {
                        if (purchase.getUser().getId().equals(userId) &&
                                        !purchase.getPurchasedAt().isBefore(story.getPublishedAt())) {
                                return true;
                        }
                }

                // Check if user purchased the whole book (active, non-refunded)
                List<BookPurchase> bookPurchases = bookPurchaseRepository
                                .findActiveByUserAndStoryOrderByPurchasedAtDesc(user, story);
                for (BookPurchase purchase : bookPurchases) {
                        if (!purchase.getPurchasedAt().isBefore(story.getPublishedAt())) {
                                return true;
                        }
                }

                return false;
        }

        @Override
        public RefundCalculationResult calculateStoryRefund(UUID storyId) {
                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Story not found"));

                log.info("🧮 Calculating refund for story: {} (Title: '{}', PricingType: {})",
                                storyId, story.getTitle(), story.getPricingType());

                if (story.getPricingType() == Story.PricingType.WHOLE_BOOK) {
                        // For WHOLE_BOOK pricing, refund all book purchasers the full book price
                        List<BookPurchase> activeBookPurchases = bookPurchaseRepository
                                        .findActiveByStoryOrderByPurchasedAtDesc(story);

                        if (activeBookPurchases.isEmpty()) {
                                log.info("❌ No active book purchases found for story: {}", storyId);
                                return new RefundCalculationResult(false, BigDecimal.ZERO, 0, false, "WHOLE_BOOK");
                        }

                        BigDecimal totalRefund = story.getBookPrice()
                                        .multiply(BigDecimal.valueOf(activeBookPurchases.size()));

                        log.info("💰 Story refund calculation: {} purchasers × {} coins = {} total refund",
                                        activeBookPurchases.size(), story.getBookPrice(), totalRefund);

                        return new RefundCalculationResult(true, totalRefund, activeBookPurchases.size(), true,
                                        "WHOLE_BOOK");
                } else if (story.getPricingType() == Story.PricingType.PAID_PER_CHAPTER) {
                        // For PAID_PER_CHAPTER pricing, refund all chapter purchasers
                        List<ChapterPurchase> activeChapterPurchases = chapterPurchaseRepository
                                        .findByStoryAndIsRefundedFalseOrderByPurchasedAtDesc(story);

                        if (activeChapterPurchases.isEmpty()) {
                                log.info("❌ No active chapter purchases found for story: {}", storyId);
                                return new RefundCalculationResult(false, BigDecimal.ZERO, 0, false,
                                                "PAID_PER_CHAPTER");
                        }

                        BigDecimal totalRefund = BigDecimal.ZERO;
                        for (ChapterPurchase purchase : activeChapterPurchases) {
                                totalRefund = totalRefund.add(purchase.getCoinsSpent());
                        }

                        log.info("💰 Story refund calculation: {} chapter purchases = {} total refund",
                                        activeChapterPurchases.size(), totalRefund);

                        return new RefundCalculationResult(true, totalRefund, activeChapterPurchases.size(), true,
                                        "PAID_PER_CHAPTER");
                } else {
                        // Free stories don't require refunds
                        log.info("📖 Free story - no refunds required for story: {}", storyId);
                        return new RefundCalculationResult(false, BigDecimal.ZERO, 0, false, "FREE");
                }
        }

        @Override
        public RefundCalculationResult calculateChapterRefund(UUID chapterId) {

                Chapter chapter = chapterRepository.findById(chapterId)
                                .orElseThrow(() -> new RuntimeException("Chapter not found"));
                Story story = chapter.getStory();

                log.info("🧮 Calculating refund for chapter: {} (Title: '{}', Story: '{}', PricingType: {})",
                                chapterId, chapter.getTitle(), story.getTitle(), story.getPricingType());

                if (story.getPricingType() == Story.PricingType.WHOLE_BOOK) {
                        List<BookPurchase> bookPurchases = bookPurchaseRepository
                                        .findActiveByStoryOrderByPurchasedAtDesc(story);
                        boolean hasPurchases = !bookPurchases.isEmpty();
                        int affectedPurchasers = bookPurchases.size();

                        if (!hasPurchases) {
                                return new RefundCalculationResult(false, BigDecimal.ZERO, 0, false, "WHOLE_BOOK");
                        }

                        long numberOfChapters = chapterRepository.countByStory(story);
                        if (numberOfChapters == 0) {
                                return new RefundCalculationResult(true, BigDecimal.ZERO, affectedPurchasers, false,
                                                "WHOLE_BOOK");
                        }

                        BigDecimal refundPerUser = story.getBookPrice().divide(BigDecimal.valueOf(numberOfChapters), 2,
                                        RoundingMode.HALF_UP);
                        BigDecimal totalRefund = refundPerUser.multiply(BigDecimal.valueOf(affectedPurchasers));

                        log.info("📖 Chapter is part of a WHOLE_BOOK purchase. Refunding {} purchasers {} each for a total of {}.",
                                        affectedPurchasers, refundPerUser, totalRefund);
                        return new RefundCalculationResult(true, totalRefund, affectedPurchasers, true, "WHOLE_BOOK");
                }

                // This logic is for PAID_PER_CHAPTER stories only.
                if (story.getPricingType() != Story.PricingType.PAID_PER_CHAPTER) {
                        log.warn("⚠️ Chapter refund requested for a non-PAID_PER_CHAPTER story. No refund will be issued.");
                        return new RefundCalculationResult(false, BigDecimal.ZERO, 0, false,
                                        story.getPricingType().name());
                }

                List<ChapterPurchase> activeChapterPurchases = chapterPurchaseRepository
                                .findByChapterAndIsRefundedFalseOrderByPurchasedAtDesc(chapter);

                if (activeChapterPurchases.isEmpty()) {
                        log.info("❌ No active purchases found for chapter: {}", chapterId);
                        return new RefundCalculationResult(false, BigDecimal.ZERO, 0, false, "PAID_PER_CHAPTER");
                }

                BigDecimal totalRefund = BigDecimal.ZERO;
                for (ChapterPurchase purchase : activeChapterPurchases) {
                        totalRefund = totalRefund.add(purchase.getCoinsSpent());
                }

                log.info("💰 Chapter refund calculation: {} chapter purchases = {} total refund",
                                activeChapterPurchases.size(), totalRefund);

                return new RefundCalculationResult(true, totalRefund, activeChapterPurchases.size(), true,
                                "PAID_PER_CHAPTER");
        }
}