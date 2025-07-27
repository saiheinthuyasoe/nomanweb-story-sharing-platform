package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.service.PurchaseProtectionService;
import com.app.nomanweb_backend.entity.*;
import com.app.nomanweb_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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

                // Check book purchases (only active, non-refunded)
                List<BookPurchase> bookPurchases = bookPurchaseRepository
                                .findActiveByStoryOrderByPurchasedAtDesc(story);
                log.info("📚 Found {} active book purchases for story: {}", bookPurchases.size(), storyId);

                if (!bookPurchases.isEmpty()) {
                        log.info("✅ Found book purchases - story has purchases: TRUE");
                        return true;
                }

                // Check chapter purchases (only active, non-refunded)
                List<ChapterPurchase> chapterPurchases = chapterPurchaseRepository
                                .findByStoryAndIsRefundedFalseOrderByPurchasedAtDesc(story);
                log.info("📖 Found {} active chapter purchases for story: {}", chapterPurchases.size(), storyId);

                if (!chapterPurchases.isEmpty()) {
                        log.info("✅ Found chapter purchases - story has purchases: TRUE");
                        return true;
                }

                log.info("❌ No purchases found - story has purchases: FALSE");
                return false;
        }

        @Override
        public boolean chapterHasPurchases(UUID chapterId) {
                Chapter chapter = chapterRepository.findById(chapterId)
                                .orElseThrow(() -> new RuntimeException("Chapter not found"));

                log.info("🔍 Checking purchases for chapter: {} (Title: '{}', Story: '{}', PricingType: {})",
                                chapterId, chapter.getTitle(), chapter.getStory().getTitle(),
                                chapter.getStory().getPricingType());

                // If story is WHOLE_BOOK pricing, check for book purchases
                if (chapter.getStory().getPricingType() == Story.PricingType.WHOLE_BOOK) {
                        List<BookPurchase> bookPurchases = bookPurchaseRepository
                                        .findActiveByStoryOrderByPurchasedAtDesc(chapter.getStory());
                        log.info("📚 Found {} active book purchases for story: {}", bookPurchases.size(),
                                        chapter.getStory().getId());

                        if (!bookPurchases.isEmpty()) {
                                log.info("✅ Found book purchases - chapter has purchases: TRUE");
                                return true;
                        }
                }

                // Check for direct chapter purchases (only active, non-refunded)
                List<ChapterPurchase> purchases = chapterPurchaseRepository
                                .findByChapterAndIsRefundedFalseOrderByPurchasedAtDesc(chapter);
                log.info("📖 Found {} active direct chapter purchases for chapter: {}", purchases.size(), chapterId);

                if (!purchases.isEmpty()) {
                        log.info("✅ Found chapter purchases - chapter has purchases: TRUE");
                        return true;
                }

                log.info("❌ No purchases found - chapter has purchases: FALSE");
                return false;
        }

        @Override
        public boolean userHasPurchasedStoryAccess(UUID userId, UUID storyId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Story not found"));

                // Check if user purchased the whole book (active, non-refunded)
                List<BookPurchase> bookPurchases = bookPurchaseRepository
                                .findActiveByUserAndStoryOrderByPurchasedAtDesc(user, story);
                if (!bookPurchases.isEmpty()) {
                        return true;
                }

                // Check if user purchased any chapters from this story (active, non-refunded)
                List<ChapterPurchase> chapterPurchases = chapterPurchaseRepository
                                .findByStoryAndIsRefundedFalseOrderByPurchasedAtDesc(story);

                for (ChapterPurchase purchase : chapterPurchases) {
                        if (purchase.getUser().getId().equals(userId)) {
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

                // Check if user purchased this specific chapter (active, non-refunded)
                List<ChapterPurchase> chapterPurchases = chapterPurchaseRepository
                                .findByChapterAndIsRefundedFalseOrderByPurchasedAtDesc(chapter);
                for (ChapterPurchase purchase : chapterPurchases) {
                        if (purchase.getUser().getId().equals(userId)) {
                                return true;
                        }
                }

                // Check if user purchased the whole book (active, non-refunded)
                List<BookPurchase> bookPurchases = bookPurchaseRepository
                                .findActiveByUserAndStoryOrderByPurchasedAtDesc(user, chapter.getStory());
                if (!bookPurchases.isEmpty()) {
                        return true;
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
                                        .findActiveByStoryOrderByPurchasedAtDesc(story).stream()
                                        .filter(p -> story.getPublishedAt() != null
                                                        && !p.getPurchasedAt().isBefore(story.getPublishedAt()))
                                        .collect(java.util.stream.Collectors.toList());

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
                        // For WHOLE_BOOK pricing, calculate proportional refund for all book purchasers
                        List<BookPurchase> activeBookPurchases = bookPurchaseRepository
                                        .findActiveByStoryOrderByPurchasedAtDesc(story);

                        if (activeBookPurchases.isEmpty()) {
                                log.info("❌ No active book purchases found for chapter: {}", chapterId);
                                return new RefundCalculationResult(false, BigDecimal.ZERO, 0, false, "WHOLE_BOOK");
                        }

                        // Count total published chapters to calculate proportional refund
                        long totalPublishedChapters = chapterRepository.countByStoryAndStatus(story,
                                        Chapter.Status.PUBLISHED);
                        if (totalPublishedChapters <= 0) {
                                log.info("❌ No published chapters found for story: {}", story.getId());
                                return new RefundCalculationResult(false, BigDecimal.ZERO, 0, false, "WHOLE_BOOK");
                        }

                        // Calculate refund amount per chapter: book price / total chapters
                        BigDecimal refundPerChapter = story.getBookPrice()
                                        .divide(BigDecimal.valueOf(totalPublishedChapters), 2,
                                                        java.math.RoundingMode.HALF_UP);

                        BigDecimal totalRefund = refundPerChapter
                                        .multiply(BigDecimal.valueOf(activeBookPurchases.size()));

                        log.info("💰 Chapter refund calculation: {} purchasers × ({} ÷ {} chapters) = {} total refund",
                                        activeBookPurchases.size(), story.getBookPrice(), totalPublishedChapters,
                                        totalRefund);

                        return new RefundCalculationResult(true, totalRefund, activeBookPurchases.size(), true,
                                        "WHOLE_BOOK");
                } else if (story.getPricingType() == Story.PricingType.PAID_PER_CHAPTER) {
                        // For PAID_PER_CHAPTER pricing, refund individual chapter purchasers
                        List<ChapterPurchase> activeChapterPurchases = chapterPurchaseRepository
                                        .findByChapterAndIsRefundedFalseOrderByPurchasedAtDesc(chapter);

                        if (activeChapterPurchases.isEmpty()) {
                                log.info("❌ No active chapter purchases found for chapter: {}", chapterId);
                                return new RefundCalculationResult(false, BigDecimal.ZERO, 0, false,
                                                "PAID_PER_CHAPTER");
                        }

                        BigDecimal totalRefund = BigDecimal.ZERO;
                        for (ChapterPurchase purchase : activeChapterPurchases) {
                                totalRefund = totalRefund.add(purchase.getCoinsSpent());
                        }

                        log.info("💰 Chapter refund calculation: {} chapter purchases = {} total refund",
                                        activeChapterPurchases.size(), totalRefund);

                        return new RefundCalculationResult(true, totalRefund, activeChapterPurchases.size(), true,
                                        "PAID_PER_CHAPTER");
                } else {
                        // Free chapters don't require refunds
                        log.info("📖 Free chapter - no refunds required for chapter: {}", chapterId);
                        return new RefundCalculationResult(false, BigDecimal.ZERO, 0, false, "FREE");
                }
        }
}