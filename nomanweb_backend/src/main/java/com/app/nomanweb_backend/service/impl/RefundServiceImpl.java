package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.service.RefundService;
import com.app.nomanweb_backend.service.PurchaseProtectionService;
import com.app.nomanweb_backend.entity.*;
import com.app.nomanweb_backend.dto.refund.RefundRequest;
import com.app.nomanweb_backend.dto.refund.RefundCalculationResponse;
import com.app.nomanweb_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RefundServiceImpl implements RefundService {

    private final RefundTransactionRepository refundTransactionRepository;
    private final BookPurchaseRepository bookPurchaseRepository;
    private final ChapterPurchaseRepository chapterPurchaseRepository;
    private final CoinTransactionRepository coinTransactionRepository;
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final UserRepository userRepository;
    private final PurchaseProtectionService purchaseProtectionService;

    @Override
    public List<RefundTransaction> processStoryRefund(UUID storyId, UUID authorId, RefundRequest.RefundType refundType,
            String reason) {
        log.info("Processing story refund for story: {} by author: {}", storyId, authorId);

        Story story = storyRepository.findById(storyId)
                .orElseThrow(() -> new RuntimeException("Story not found"));

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Author not found"));

        if (!story.getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Only the author can initiate refunds for their story");
        }

        List<RefundTransaction> refundTransactions = new ArrayList<>();

        // Create refund transactions for book purchases (only active ones)
        List<BookPurchase> bookPurchases = bookPurchaseRepository
                .findActiveByStoryOrderByPurchasedAtDesc(story);
        for (BookPurchase purchase : bookPurchases) {
            RefundTransaction refundTransaction = RefundTransaction.builder()
                    .author(author)
                    .buyer(purchase.getUser())
                    .story(story)
                    .refundAmount(purchase.getCoinsSpent())
                    .originalPurchaseAmount(purchase.getCoinsSpent())
                    .refundType(mapToRefundTransactionType(refundType))
                    .reason(reason)
                    .build();

            refundTransactions.add(refundTransactionRepository.save(refundTransaction));
        }

        // Create refund transactions for chapter purchases (only active ones)
        List<ChapterPurchase> chapterPurchases = chapterPurchaseRepository
                .findActiveByStoryOrderByPurchasedAtDesc(story);
        for (ChapterPurchase purchase : chapterPurchases) {
            RefundTransaction refundTransaction = RefundTransaction.builder()
                    .author(author)
                    .buyer(purchase.getUser())
                    .story(story)
                    .chapter(purchase.getChapter())
                    .refundAmount(purchase.getCoinsSpent())
                    .originalPurchaseAmount(purchase.getCoinsSpent())
                    .refundType(mapToRefundTransactionType(refundType))
                    .reason(reason)
                    .build();

            refundTransactions.add(refundTransactionRepository.save(refundTransaction));
        }

        log.info("Created {} refund transactions for story: {}", refundTransactions.size(), storyId);

        // Auto-execute refunds for STORY_DELETION type (purchase protection scenario)
        if (refundType == RefundRequest.RefundType.STORY_DELETION) {
            log.info("Auto-executing refunds for DELETE_CONTENT scenario");
            for (RefundTransaction refundTransaction : refundTransactions) {
                try {
                    // Auto-approve the refund first (required for execution)
                    refundTransaction.approve(author);
                    refundTransactionRepository.save(refundTransaction);

                    // Then execute it
                    executeRefund(refundTransaction.getId());
                    log.info("Auto-executed refund: {}", refundTransaction.getId());
                } catch (Exception e) {
                    log.error("Failed to auto-execute refund: {}", refundTransaction.getId(), e);
                }
            }
        }

        return refundTransactions;
    }

    @Override
    public List<RefundTransaction> processChapterRefund(UUID chapterId, UUID authorId,
            RefundRequest.RefundType refundType, String reason) {
        log.info("Processing chapter refund for chapter: {} by author: {}", chapterId, authorId);

        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new RuntimeException("Chapter not found"));

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Author not found"));

        if (!chapter.getStory().getAuthor().getId().equals(authorId)) {
            throw new RuntimeException("Only the author can initiate refunds for their chapter");
        }

        List<RefundTransaction> refundTransactions = new ArrayList<>();

        // Handle refunds based on story pricing type
        if (chapter.getStory().getPricingType() == Story.PricingType.WHOLE_BOOK) {
            // For WHOLE_BOOK pricing, refund book purchasers proportionally (only active
            // ones)
            List<BookPurchase> bookPurchases = bookPurchaseRepository
                    .findActiveByStoryOrderByPurchasedAtDesc(chapter.getStory());

            // Count total published chapters in the story
            long totalPublishedChapters = chapterRepository.countByStoryAndStatus(chapter.getStory(),
                    Chapter.Status.PUBLISHED);

            if (totalPublishedChapters > 0) {
                // Calculate refund amount per chapter: book price / total chapters
                BigDecimal refundPerChapter = chapter.getStory().getBookPrice()
                        .divide(BigDecimal.valueOf(totalPublishedChapters), 2, RoundingMode.HALF_UP);

                for (BookPurchase purchase : bookPurchases) {
                    RefundTransaction refundTransaction = RefundTransaction.builder()
                            .author(author)
                            .buyer(purchase.getUser())
                            .story(chapter.getStory())
                            .chapter(chapter)
                            .refundAmount(refundPerChapter)
                            .originalPurchaseAmount(purchase.getCoinsSpent())
                            .refundType(mapToRefundTransactionType(refundType))
                            .reason(reason)
                            .build();

                    refundTransactions.add(refundTransactionRepository.save(refundTransaction));
                }
            }
        } else {
            // For PAID_PER_CHAPTER pricing, refund individual chapter purchasers (only
            // active ones)
            List<ChapterPurchase> chapterPurchases = chapterPurchaseRepository
                    .findActiveByChapterOrderByPurchasedAtDesc(chapter);
            for (ChapterPurchase purchase : chapterPurchases) {
                RefundTransaction refundTransaction = RefundTransaction.builder()
                        .author(author)
                        .buyer(purchase.getUser())
                        .story(chapter.getStory())
                        .chapter(chapter)
                        .refundAmount(purchase.getCoinsSpent())
                        .originalPurchaseAmount(purchase.getCoinsSpent())
                        .refundType(mapToRefundTransactionType(refundType))
                        .reason(reason)
                        .build();

                refundTransactions.add(refundTransactionRepository.save(refundTransaction));
            }
        }

        log.info("Created {} refund transactions for chapter: {}", refundTransactions.size(), chapterId);

        // Auto-execute refunds for CHAPTER_DELETION type (purchase protection scenario)
        if (refundType == RefundRequest.RefundType.CHAPTER_DELETION) {
            for (RefundTransaction refundTransaction : refundTransactions) {
                try {
                    executeRefund(refundTransaction.getId());
                    log.info("Auto-executed refund for chapter deletion: {}", refundTransaction.getId());
                } catch (Exception e) {
                    log.error("Failed to auto-execute refund for chapter deletion: {}", refundTransaction.getId(), e);
                }
            }
        }

        return refundTransactions;
    }

    @Override
    public void executeRefund(UUID refundTransactionId) {
        RefundTransaction refundTransaction = refundTransactionRepository.findById(refundTransactionId)
                .orElseThrow(() -> new RuntimeException("Refund transaction not found"));

        if (!refundTransaction.isApproved()) {
            throw new RuntimeException("Refund transaction must be approved before execution");
        }

        try {
            // Check if author has enough coins
            if (!purchaseProtectionService.authorCanAffordRefund(refundTransaction.getAuthor().getId(),
                    refundTransaction.getRefundAmount())) {
                refundTransaction.fail("Author has insufficient coins for refund");
                refundTransactionRepository.save(refundTransaction);
                return;
            }

            // Deduct coins from author
            User author = refundTransaction.getAuthor();
            author.setCoinBalance(author.getCoinBalance().subtract(refundTransaction.getRefundAmount()));
            userRepository.save(author);

            // Create coin transaction for author deduction
            CoinTransaction authorTransaction = CoinTransaction.builder()
                    .user(author)
                    .transactionType(CoinTransaction.TransactionType.REFUND)
                    .amount(refundTransaction.getRefundAmount().negate())
                    .balanceBefore(author.getCoinBalance().add(refundTransaction.getRefundAmount()))
                    .balanceAfter(author.getCoinBalance())
                    .description("Refund payment for " + (refundTransaction.getChapter() != null
                            ? "chapter: " + refundTransaction.getChapter().getTitle()
                            : "story: " + refundTransaction.getStory().getTitle()))
                    .referenceType(refundTransaction.getChapter() != null ? CoinTransaction.ReferenceType.CHAPTER
                            : CoinTransaction.ReferenceType.STORY)
                    .referenceId(refundTransaction.getChapter() != null ? refundTransaction.getChapter().getId()
                            : refundTransaction.getStory().getId())
                    .build();

            coinTransactionRepository.save(authorTransaction);

            // Add coins to buyer
            User buyer = refundTransaction.getBuyer();
            buyer.setCoinBalance(buyer.getCoinBalance().add(refundTransaction.getRefundAmount()));
            userRepository.save(buyer);

            // Create coin transaction for buyer refund
            CoinTransaction buyerTransaction = CoinTransaction.builder()
                    .user(buyer)
                    .transactionType(CoinTransaction.TransactionType.REFUND)
                    .amount(refundTransaction.getRefundAmount())
                    .balanceBefore(buyer.getCoinBalance().subtract(refundTransaction.getRefundAmount()))
                    .balanceAfter(buyer.getCoinBalance())
                    .description("Refund received for " + (refundTransaction.getChapter() != null
                            ? "chapter: " + refundTransaction.getChapter().getTitle()
                            : "story: " + refundTransaction.getStory().getTitle()))
                    .referenceType(refundTransaction.getChapter() != null ? CoinTransaction.ReferenceType.CHAPTER
                            : CoinTransaction.ReferenceType.STORY)
                    .referenceId(refundTransaction.getChapter() != null ? refundTransaction.getChapter().getId()
                            : refundTransaction.getStory().getId())
                    .build();

            coinTransactionRepository.save(buyerTransaction);

            // Mark original purchases as refunded so readers lose access
            // Note: This will work properly once the database migration is applied
            try {
                if (refundTransaction.getChapter() != null) {
                    // This is a chapter refund - find and mark chapter purchase as refunded
                    Optional<ChapterPurchase> chapterPurchase = chapterPurchaseRepository
                            .findByUserAndChapter(buyer, refundTransaction.getChapter());
                    if (chapterPurchase.isPresent() && chapterPurchase.get().isActive()) {
                        chapterPurchase.get().markAsRefunded();
                        chapterPurchaseRepository.save(chapterPurchase.get());
                        log.info("Marked chapter purchase as refunded: {}", chapterPurchase.get().getId());
                    }
                } else {
                    // This is a book refund - find and mark book purchase as refunded
                    List<BookPurchase> userPurchases = bookPurchaseRepository.findByUserOrderByPurchasedAtDesc(buyer);
                    for (BookPurchase purchase : userPurchases) {
                        if (purchase.getStory().getId().equals(refundTransaction.getStory().getId())
                                && purchase.isActive()) {
                            purchase.markAsRefunded();
                            bookPurchaseRepository.save(purchase);
                            log.info("Marked book purchase as refunded: {}", purchase.getId());
                            break; // Only mark the first (most recent) non-refunded purchase for this story
                        }
                    }
                }
            } catch (Exception e) {
                // This will happen if the database migration for refund tracking hasn't been
                // applied yet
                log.warn("Could not mark purchases as refunded - database migration may be needed: {}", e.getMessage());
                log.info("Refund completed successfully, but purchase marking skipped due to missing columns");
            }

            // Mark refund as completed
            refundTransaction.complete();
            refundTransactionRepository.save(refundTransaction);

            log.info("Refund executed successfully: {}", refundTransactionId);

        } catch (Exception e) {
            log.error("Failed to execute refund: {}", refundTransactionId, e);
            refundTransaction.fail("Execution failed: " + e.getMessage());
            refundTransactionRepository.save(refundTransaction);
        }
    }

    @Override
    public RefundTransaction approveRefund(UUID refundTransactionId, UUID adminId) {
        RefundTransaction refundTransaction = refundTransactionRepository.findById(refundTransactionId)
                .orElseThrow(() -> new RuntimeException("Refund transaction not found"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        refundTransaction.approve(admin);
        RefundTransaction savedRefund = refundTransactionRepository.save(refundTransaction);

        // Auto-execute the refund
        executeRefund(refundTransactionId);

        return savedRefund;
    }

    @Override
    public RefundTransaction rejectRefund(UUID refundTransactionId, UUID adminId, String reason) {
        RefundTransaction refundTransaction = refundTransactionRepository.findById(refundTransactionId)
                .orElseThrow(() -> new RuntimeException("Refund transaction not found"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        refundTransaction.reject(admin, reason);
        return refundTransactionRepository.save(refundTransaction);
    }

    @Override
    public Page<RefundTransaction> getAuthorRefunds(UUID authorId, Pageable pageable) {
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("Author not found"));

        return refundTransactionRepository.findByAuthorOrderByCreatedAtDesc(author, pageable);
    }

    @Override
    public Page<RefundTransaction> getBuyerRefunds(UUID buyerId, Pageable pageable) {
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new RuntimeException("Buyer not found"));

        return refundTransactionRepository.findByBuyerOrderByCreatedAtDesc(buyer, pageable);
    }

    @Override
    public Page<RefundTransaction> getPendingRefunds(Pageable pageable) {
        return refundTransactionRepository
                .findByRefundStatusOrderByCreatedAtDesc(RefundTransaction.RefundStatus.PENDING, pageable);
    }

    @Override
    public RefundTransaction getRefundById(UUID refundId) {
        return refundTransactionRepository.findById(refundId)
                .orElseThrow(() -> new RuntimeException("Refund transaction not found"));
    }

    @Override
    public RefundCalculationResponse calculateStoryRefund(UUID storyId) {
        return purchaseProtectionService.calculateStoryRefundAmount(storyId);
    }

    @Override
    public RefundCalculationResponse calculateChapterRefund(UUID chapterId) {
        return purchaseProtectionService.calculateChapterRefundAmount(chapterId);
    }

    private RefundTransaction.RefundType mapToRefundTransactionType(RefundRequest.RefundType refundType) {
        switch (refundType) {
            case STORY_DELETION:
                return RefundTransaction.RefundType.STORY_DELETION;
            case CHAPTER_DELETION:
                return RefundTransaction.RefundType.CHAPTER_DELETION;
            case STORY_UNPUBLISH:
                return RefundTransaction.RefundType.STORY_UNPUBLISH;
            case CHAPTER_UNPUBLISH:
                return RefundTransaction.RefundType.CHAPTER_UNPUBLISH;
            case PRICING_CHANGE_TO_FREE:
                return RefundTransaction.RefundType.PRICING_CHANGE_TO_FREE;
            case PRICING_CHANGE:
                return RefundTransaction.RefundType.PRICING_CHANGE;
            default:
                return RefundTransaction.RefundType.MANUAL_REFUND;
        }
    }
}