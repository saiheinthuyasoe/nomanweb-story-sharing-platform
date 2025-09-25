package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.User;

import java.math.BigDecimal;
import java.util.UUID;

public interface PurchaseProtectionService {

    /**
     * Check if a story has any purchases (either book purchases or chapter
     * purchases)
     */
    boolean storyHasPurchases(UUID storyId);

    /**
     * Check if a chapter has any purchases
     */
    boolean chapterHasPurchases(UUID chapterId);

    /**
     * Check if user has purchased access to a story in any form
     * (either whole book or individual chapters)
     */
    boolean userHasPurchasedStoryAccess(UUID userId, UUID storyId);

    /**
     * Check if user has purchased a specific chapter
     */
    boolean userHasPurchasedChapter(UUID userId, UUID chapterId);

    /**
     * Calculate refund details for unpublishing a story
     * Returns total refund amount and number of affected purchasers
     */
    RefundCalculationResult calculateStoryRefund(UUID storyId);

    /**
     * Calculate refund details for unpublishing a chapter
     * Returns total refund amount and number of affected purchasers
     */
    RefundCalculationResult calculateChapterRefund(UUID chapterId);

    /**
     * Result class for refund calculations
     */
    class RefundCalculationResult {
        private final boolean hasPurchases;
        private final BigDecimal totalRefundAmount;
        private final int affectedPurchasers;
        private final boolean requiresRefunds;
        private final String pricingType;

        public RefundCalculationResult(boolean hasPurchases, BigDecimal totalRefundAmount,
                int affectedPurchasers, boolean requiresRefunds, String pricingType) {
            this.hasPurchases = hasPurchases;
            this.totalRefundAmount = totalRefundAmount;
            this.affectedPurchasers = affectedPurchasers;
            this.requiresRefunds = requiresRefunds;
            this.pricingType = pricingType;
        }

        public boolean isHasPurchases() {
            return hasPurchases;
        }

        public BigDecimal getTotalRefundAmount() {
            return totalRefundAmount;
        }

        public int getAffectedPurchasers() {
            return affectedPurchasers;
        }

        public boolean isRequiresRefunds() {
            return requiresRefunds;
        }

        public String getPricingType() {
            return pricingType;
        }
    }
}