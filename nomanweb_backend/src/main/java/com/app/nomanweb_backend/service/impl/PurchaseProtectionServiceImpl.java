package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.service.PurchaseProtectionService;
import com.app.nomanweb_backend.entity.*;
import com.app.nomanweb_backend.dto.refund.RefundCalculationResponse;
import com.app.nomanweb_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PurchaseProtectionServiceImpl implements PurchaseProtectionService {

        private final BookPurchaseRepository bookPurchaseRepository;
        private final ChapterPurchaseRepository chapterPurchaseRepository;
        private final RefundTransactionRepository refundTransactionRepository;
        private final StoryRepository storyRepository;
        private final ChapterRepository chapterRepository;
        private final UserRepository userRepository;

        @Override
        public boolean storyHasPurchases(UUID storyId) {
                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Story not found"));

                log.info("🔍 Checking purchases for story: {} (Title: '{}', PricingType: {})",
                                storyId, story.getTitle(), story.getPricingType());

                // Check book purchases (excluding those with completed refunds)
                List<BookPurchase> bookPurchases = bookPurchaseRepository.findByStoryOrderByPurchasedAtDesc(story, null)
                                .getContent();
                log.info("📚 Found {} book purchases for story: {}", bookPurchases.size(), storyId);

                for (BookPurchase purchase : bookPurchases) {
                        // Check if this purchase is active (not refunded)
                        if (purchase.isActive()) {
                                // Additional check: purchase must be made after the story's current publish
                                // date
                                // This prevents counting old purchases when a story is republished after
                                // refunds
                                if (story.getPublishedAt() != null &&
                                                purchase.getPurchasedAt().isAfter(story.getPublishedAt())) {
                                        log.info("✅ Found valid book purchase (purchased after current publish date) - story has purchases: TRUE");
                                        return true;
                                }
                                log.info("📅 Book purchase by user {} was made before current publish date - not counting as active",
                                                purchase.getUser().getUsername());
                        } else {
                                log.info("💰 Book purchase by user {} is refunded - not counting as active",
                                                purchase.getUser().getUsername());
                        }
                }

                // Check chapter purchases (excluding those with completed refunds)
                List<ChapterPurchase> chapterPurchases = chapterPurchaseRepository
                                .findByStoryOrderByPurchasedAtDesc(story);
                log.info("📖 Found {} chapter purchases for story: {}", chapterPurchases.size(), storyId);

                for (ChapterPurchase purchase : chapterPurchases) {
                        // Check if this purchase is active (not refunded)
                        if (purchase.isActive()) {
                                // Additional check: purchase must be made after the story's current publish
                                // date
                                // This prevents counting old purchases when a story is republished after
                                // refunds
                                if (story.getPublishedAt() != null &&
                                                purchase.getPurchasedAt().isAfter(story.getPublishedAt())) {
                                        log.info("✅ Found valid chapter purchase (purchased after current publish date) - story has purchases: TRUE");
                                        return true;
                                }
                                log.info("📅 Chapter purchase by user {} was made before current publish date - not counting as active",
                                                purchase.getUser().getUsername());
                        } else {
                                log.info("💰 Chapter purchase by user {} is refunded - not counting as active",
                                                purchase.getUser().getUsername());
                        }
                }

                log.info("❌ No active purchases found - story has purchases: FALSE");
                return false; // All purchases have been refunded
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
                                        .findByStoryOrderByPurchasedAtDesc(chapter.getStory(), null).getContent();
                        log.info("📚 Found {} book purchases for story: {}", bookPurchases.size(),
                                        chapter.getStory().getId());

                        for (BookPurchase purchase : bookPurchases) {
                                log.info("🔍 Checking book purchase: {} by user: {} for chapter: {}",
                                                purchase.getId(), purchase.getUser().getUsername(), chapterId);

                                // For WHOLE_BOOK pricing, check if there's a completed refund for this chapter
                                // We need to check for refunds that reference this specific chapter
                                List<RefundTransaction> refunds = refundTransactionRepository
                                                .findByStoryAndBuyerAndChapterAndRefundStatus(chapter.getStory(),
                                                                purchase.getUser(),
                                                                chapter,
                                                                RefundTransaction.RefundStatus.COMPLETED);
                                log.info("💰 Book purchase by user {} has {} completed refunds for chapter {}",
                                                purchase.getUser().getUsername(), refunds.size(), chapterId);

                                if (refunds.isEmpty()) {
                                        log.info("✅ Found active book purchase without chapter refund - chapter has purchases: TRUE");
                                        return true; // Found a book purchase without completed refund for this chapter
                                } else {
                                        log.info("✅ Book purchase has completed refunds - checking next purchase");
                                }
                        }

                        log.info("✅ All book purchases have completed refunds for chapter: {}", chapterId);
                }

                // Check for direct chapter purchases (for PAID_PER_CHAPTER pricing or
                // individual chapter purchases)
                List<ChapterPurchase> purchases = chapterPurchaseRepository
                                .findByChapterOrderByPurchasedAtDesc(chapter);
                log.info("📖 Found {} direct chapter purchases for chapter: {}", purchases.size(), chapterId);

                // Check if any of the purchases don't have completed refunds
                for (ChapterPurchase purchase : purchases) {
                        // Check if this specific purchase has a completed refund
                        List<RefundTransaction> refunds = refundTransactionRepository
                                        .findByStoryAndBuyerAndChapterAndRefundStatus(chapter.getStory(),
                                                        purchase.getUser(),
                                                        purchase.getChapter(),
                                                        RefundTransaction.RefundStatus.COMPLETED);
                        log.info("💰 Chapter purchase by user {} has {} completed refunds",
                                        purchase.getUser().getUsername(), refunds.size());
                        if (refunds.isEmpty()) {
                                log.info("✅ Found active chapter purchase - chapter has purchases: TRUE");
                                return true; // Found a purchase without completed refund
                        }
                }

                log.info("❌ No active purchases found - chapter has purchases: FALSE");
                return false; // All purchases have been refunded
        }

        @Override
        public RefundCalculationResponse calculateStoryRefundAmount(UUID storyId) {
                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Story not found"));

                List<RefundCalculationResponse.RefundItem> refundItems = new ArrayList<>();
                BigDecimal totalRefundAmount = BigDecimal.ZERO;
                int totalBuyersCount = 0;

                // Calculate book purchase refunds (only active/non-refunded purchases)
                List<BookPurchase> bookPurchases = bookPurchaseRepository
                                .findActiveByStoryOrderByPurchasedAtDesc(story);
                for (BookPurchase purchase : bookPurchases) {
                        RefundCalculationResponse.RefundItem item = RefundCalculationResponse.RefundItem.builder()
                                        .buyerUsername(purchase.getUser().getUsername())
                                        .buyerEmail(purchase.getUser().getEmail())
                                        .itemType("BOOK")
                                        .itemTitle(story.getTitle())
                                        .refundAmount(purchase.getCoinsSpent())
                                        .purchaseDate(purchase.getPurchasedAt()
                                                        .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                                        .build();

                        refundItems.add(item);
                        totalRefundAmount = totalRefundAmount.add(purchase.getCoinsSpent());
                        totalBuyersCount++;
                }

                // Calculate chapter purchase refunds (only active/non-refunded purchases)
                List<ChapterPurchase> chapterPurchases = chapterPurchaseRepository
                                .findActiveByStoryOrderByPurchasedAtDesc(story);
                for (ChapterPurchase purchase : chapterPurchases) {
                        RefundCalculationResponse.RefundItem item = RefundCalculationResponse.RefundItem.builder()
                                        .buyerUsername(purchase.getUser().getUsername())
                                        .buyerEmail(purchase.getUser().getEmail())
                                        .itemType("CHAPTER")
                                        .itemTitle(purchase.getChapter().getTitle())
                                        .refundAmount(purchase.getCoinsSpent())
                                        .purchaseDate(purchase.getPurchasedAt()
                                                        .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                                        .build();

                        refundItems.add(item);
                        totalRefundAmount = totalRefundAmount.add(purchase.getCoinsSpent());
                        totalBuyersCount++;
                }

                return RefundCalculationResponse.builder()
                                .totalRefundAmount(totalRefundAmount)
                                .totalBuyersCount(totalBuyersCount)
                                .refundItems(refundItems)
                                .build();
        }

        @Override
        public RefundCalculationResponse calculateChapterRefundAmount(UUID chapterId) {
                Chapter chapter = chapterRepository.findById(chapterId)
                                .orElseThrow(() -> new RuntimeException("Chapter not found"));

                List<RefundCalculationResponse.RefundItem> refundItems = new ArrayList<>();
                BigDecimal totalRefundAmount = BigDecimal.ZERO;
                int totalBuyersCount = 0;

                // If story is WHOLE_BOOK pricing, calculate refund based on book price divided
                // by chapters
                if (chapter.getStory().getPricingType() == Story.PricingType.WHOLE_BOOK) {
                        // Get all active book purchases for this story (exclude refunded ones)
                        List<BookPurchase> bookPurchases = bookPurchaseRepository
                                        .findActiveByStoryOrderByPurchasedAtDesc(chapter.getStory());

                        // Count total published chapters in the story
                        long totalPublishedChapters = chapterRepository.countByStoryAndStatus(chapter.getStory(),
                                        Chapter.Status.PUBLISHED);

                        if (totalPublishedChapters > 0) {
                                // Calculate refund amount per chapter: book price / total chapters
                                BigDecimal refundPerChapter = chapter.getStory().getBookPrice()
                                                .divide(BigDecimal.valueOf(totalPublishedChapters), 2,
                                                                RoundingMode.HALF_UP);

                                for (BookPurchase purchase : bookPurchases) {
                                        RefundCalculationResponse.RefundItem item = RefundCalculationResponse.RefundItem
                                                        .builder()
                                                        .buyerUsername(purchase.getUser().getUsername())
                                                        .buyerEmail(purchase.getUser().getEmail())
                                                        .itemType("BOOK_CHAPTER")
                                                        .itemTitle(chapter.getTitle() + " (from book purchase)")
                                                        .refundAmount(refundPerChapter)
                                                        .purchaseDate(purchase.getPurchasedAt()
                                                                        .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                                                        .build();

                                        refundItems.add(item);
                                        totalRefundAmount = totalRefundAmount.add(refundPerChapter);
                                        totalBuyersCount++;
                                }
                        }
                } else {
                        // For PAID_PER_CHAPTER pricing, calculate refund based on individual chapter
                        // purchases (only active/non-refunded purchases)
                        List<ChapterPurchase> purchases = chapterPurchaseRepository
                                        .findActiveByChapterOrderByPurchasedAtDesc(chapter);
                        for (ChapterPurchase purchase : purchases) {
                                RefundCalculationResponse.RefundItem item = RefundCalculationResponse.RefundItem
                                                .builder()
                                                .buyerUsername(purchase.getUser().getUsername())
                                                .buyerEmail(purchase.getUser().getEmail())
                                                .itemType("CHAPTER")
                                                .itemTitle(chapter.getTitle())
                                                .refundAmount(purchase.getCoinsSpent())
                                                .purchaseDate(purchase.getPurchasedAt()
                                                                .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                                                .build();

                                refundItems.add(item);
                                totalRefundAmount = totalRefundAmount.add(purchase.getCoinsSpent());
                                totalBuyersCount++;
                        }
                }

                return RefundCalculationResponse.builder()
                                .totalRefundAmount(totalRefundAmount)
                                .totalBuyersCount(totalBuyersCount)
                                .refundItems(refundItems)
                                .build();
        }

        /**
         * Calculate refund amount when changing pricing type from paid to free
         */
        public RefundCalculationResponse calculatePricingChangeRefundAmount(UUID storyId,
                        Story.PricingType newPricingType) {
                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Story not found"));

                List<RefundCalculationResponse.RefundItem> refundItems = new ArrayList<>();
                BigDecimal totalRefundAmount = BigDecimal.ZERO;
                int totalBuyersCount = 0;

                // Only calculate refunds when changing from paid to free
                if (newPricingType == Story.PricingType.FREE &&
                                (story.getPricingType() == Story.PricingType.WHOLE_BOOK ||
                                                story.getPricingType() == Story.PricingType.PAID_PER_CHAPTER)) {

                        // Calculate book purchase refunds (only active/non-refunded purchases)
                        List<BookPurchase> bookPurchases = bookPurchaseRepository
                                        .findActiveByStoryOrderByPurchasedAtDesc(story);
                        for (BookPurchase purchase : bookPurchases) {
                                RefundCalculationResponse.RefundItem item = RefundCalculationResponse.RefundItem
                                                .builder()
                                                .buyerUsername(purchase.getUser().getUsername())
                                                .buyerEmail(purchase.getUser().getEmail())
                                                .itemType("BOOK")
                                                .itemTitle(story.getTitle())
                                                .refundAmount(purchase.getCoinsSpent())
                                                .purchaseDate(purchase.getPurchasedAt()
                                                                .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                                                .build();

                                refundItems.add(item);
                                totalRefundAmount = totalRefundAmount.add(purchase.getCoinsSpent());
                                totalBuyersCount++;
                        }

                        // Calculate chapter purchase refunds (only active/non-refunded purchases)
                        List<ChapterPurchase> chapterPurchases = chapterPurchaseRepository
                                        .findActiveByStoryOrderByPurchasedAtDesc(story);
                        for (ChapterPurchase purchase : chapterPurchases) {
                                RefundCalculationResponse.RefundItem item = RefundCalculationResponse.RefundItem
                                                .builder()
                                                .buyerUsername(purchase.getUser().getUsername())
                                                .buyerEmail(purchase.getUser().getEmail())
                                                .itemType("CHAPTER")
                                                .itemTitle(purchase.getChapter().getTitle())
                                                .refundAmount(purchase.getCoinsSpent())
                                                .purchaseDate(purchase.getPurchasedAt()
                                                                .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                                                .build();

                                refundItems.add(item);
                                totalRefundAmount = totalRefundAmount.add(purchase.getCoinsSpent());
                                totalBuyersCount++;
                        }
                }

                return RefundCalculationResponse.builder()
                                .totalRefundAmount(totalRefundAmount)
                                .totalBuyersCount(totalBuyersCount)
                                .refundItems(refundItems)
                                .build();
        }

        /**
         * Check if pricing type change requires refunds
         */
        public boolean pricingChangeRequiresRefund(UUID storyId, Story.PricingType newPricingType) {
                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Story not found"));

                // Only require refunds when changing from paid to free
                if (newPricingType == Story.PricingType.FREE &&
                                (story.getPricingType() == Story.PricingType.WHOLE_BOOK ||
                                                story.getPricingType() == Story.PricingType.PAID_PER_CHAPTER)) {
                        return storyHasPurchases(storyId);
                }

                return false;
        }

        @Override
        public boolean authorCanAffordRefund(UUID authorId, BigDecimal refundAmount) {
                User author = userRepository.findById(authorId)
                                .orElseThrow(() -> new RuntimeException("Author not found"));

                return author.getCoinBalance().compareTo(refundAmount) >= 0;
        }

        @Override
        public boolean canDeleteChapterWithoutRefund(UUID chapterId) {
                return !chapterHasPurchases(chapterId);
        }

        @Override
        public boolean canUnpublishChapterWithoutRefund(UUID chapterId) {
                return !chapterHasPurchases(chapterId);
        }

        @Override
        public boolean canMoveChapterToTrashWithoutRefund(UUID chapterId) {
                Chapter chapter = chapterRepository.findById(chapterId)
                                .orElseThrow(() -> new RuntimeException("Chapter not found"));

                // If chapter is already unpublished (DRAFT), no refund needed for moving to
                // trash
                if (chapter.getStatus() == Chapter.Status.DRAFT) {
                        log.info("✅ Chapter {} is already unpublished (DRAFT) - no refund needed for trash", chapterId);
                        return true;
                }

                // If chapter is published, check if it has purchases
                log.info("🔍 Chapter {} is published - checking purchases for trash move", chapterId);
                return !chapterHasPurchases(chapterId);
        }

        @Override
        public boolean canDeleteStoryWithoutRefund(UUID storyId) {
                return !storyHasPurchases(storyId);
        }

        @Override
        public boolean canUnpublishStoryWithoutRefund(UUID storyId) {
                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Story not found"));

                // Special case for WHOLE_BOOK pricing type - allow unpublishing with refunds
                if (story.getPricingType() == Story.PricingType.WHOLE_BOOK) {
                        // For whole book pricing, we'll handle refunds in the frontend
                        // and allow unpublishing even with purchases
                        return true;
                }

                // For other pricing types, can only unpublish if no purchases
                return !storyHasPurchases(storyId);
        }

        @Override
        public boolean canMoveStoryToTrashWithoutRefund(UUID storyId) {
                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Story not found"));

                // If story is already unpublished (DRAFT), no refund needed for moving to trash
                if (story.getPublishStatus() == Story.PublishStatus.DRAFT) {
                        log.info("✅ Story {} is already unpublished (DRAFT) - no refund needed for trash", storyId);
                        return true;
                }

                // If story is published, check if it has purchases
                log.info("🔍 Story {} is published - checking purchases for trash move", storyId);
                return !storyHasPurchases(storyId);
        }

        @Override
        public boolean canChangePricingToFreeWithoutRefund(UUID storyId) {
                return !storyHasPurchases(storyId);
        }

        @Override
        public boolean userHasPurchasedStoryAccess(UUID userId, UUID storyId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                Story story = storyRepository.findById(storyId)
                                .orElseThrow(() -> new RuntimeException("Story not found"));

                // Check if user purchased the whole book and it's not refunded
                if (bookPurchaseRepository.existsByUserAndStory(user, story)) {
                        // Find all refund transactions for this user/story
                        List<RefundTransaction> bookRefunds = refundTransactionRepository
                                        .findByStoryAndBuyerAndChapterIsNullAndRefundStatus(story, user,
                                                        RefundTransaction.RefundStatus.COMPLETED);

                        // Count total book purchases vs total refunds
                        List<BookPurchase> allBookPurchases = bookPurchaseRepository
                                        .findByStoryOrderByPurchasedAtDesc(story, null).getContent();
                        long userBookPurchaseCount = allBookPurchases.stream()
                                        .filter(purchase -> purchase.getUser().getId().equals(userId))
                                        .count();
                        long bookRefundCount = bookRefunds.size();

                        if (userBookPurchaseCount > bookRefundCount) {
                                return true; // User has more book purchases than refunds
                        }
                }

                // Check if user purchased any chapters from this story (and they're not
                // refunded)
                List<ChapterPurchase> chapterPurchases = chapterPurchaseRepository
                                .findByStoryOrderByPurchasedAtDesc(story);

                // Group chapter purchases by chapter and count active purchases
                for (ChapterPurchase purchase : chapterPurchases) {
                        if (purchase.getUser().getId().equals(userId)) {
                                // Find all refunds for this specific user/chapter combination
                                List<RefundTransaction> chapterRefunds = refundTransactionRepository
                                                .findByStoryAndBuyerAndChapterAndRefundStatus(story, user,
                                                                purchase.getChapter(),
                                                                RefundTransaction.RefundStatus.COMPLETED);

                                // Count purchases for this specific chapter
                                long userChapterPurchaseCount = chapterPurchases.stream()
                                                .filter(p -> p.getUser().getId().equals(userId)
                                                                && p.getChapter().getId()
                                                                                .equals(purchase.getChapter().getId()))
                                                .count();
                                long chapterRefundCount = chapterRefunds.size();

                                if (userChapterPurchaseCount > chapterRefundCount) {
                                        return true; // Found an active chapter purchase
                                }
                        }
                }

                return false; // No active (non-refunded) purchases found
        }

        @Override
        public boolean userHasPurchasedChapter(UUID userId, UUID chapterId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                Chapter chapter = chapterRepository.findById(chapterId)
                                .orElseThrow(() -> new RuntimeException("Chapter not found"));

                // Check if user purchased this specific chapter and it's not refunded
                if (chapterPurchaseRepository.existsByUserAndChapter(user, chapter)) {
                        // Find all refund transactions for this user/chapter
                        List<RefundTransaction> chapterRefunds = refundTransactionRepository
                                        .findByStoryAndBuyerAndChapterAndRefundStatus(chapter.getStory(), user, chapter,
                                                        RefundTransaction.RefundStatus.COMPLETED);

                        // Count total chapter purchases vs total refunds
                        List<ChapterPurchase> allChapterPurchases = chapterPurchaseRepository
                                        .findByChapterOrderByPurchasedAtDesc(chapter);
                        long userChapterPurchaseCount = allChapterPurchases.stream()
                                        .filter(purchase -> purchase.getUser().getId().equals(userId))
                                        .count();
                        long chapterRefundCount = chapterRefunds.size();

                        if (userChapterPurchaseCount > chapterRefundCount) {
                                return true; // User has more chapter purchases than refunds
                        }
                }

                // Check if user purchased the whole book (which includes this chapter) and it's
                // not refunded
                if (bookPurchaseRepository.existsByUserAndStory(user, chapter.getStory())) {
                        // Find all refund transactions for this user/story
                        List<RefundTransaction> bookRefunds = refundTransactionRepository
                                        .findByStoryAndBuyerAndChapterIsNullAndRefundStatus(chapter.getStory(), user,
                                                        RefundTransaction.RefundStatus.COMPLETED);

                        // Count total book purchases vs total refunds
                        List<BookPurchase> allBookPurchases = bookPurchaseRepository
                                        .findByStoryOrderByPurchasedAtDesc(chapter.getStory(), null).getContent();
                        long userBookPurchaseCount = allBookPurchases.stream()
                                        .filter(purchase -> purchase.getUser().getId().equals(userId))
                                        .count();
                        long bookRefundCount = bookRefunds.size();

                        if (userBookPurchaseCount > bookRefundCount) {
                                return true; // User has more book purchases than refunds
                        }
                }

                return false; // No active (non-refunded) purchases found
        }
}