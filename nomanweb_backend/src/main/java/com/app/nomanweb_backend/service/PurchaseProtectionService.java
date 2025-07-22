package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.Chapter;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.dto.refund.RefundCalculationResponse;
import com.app.nomanweb_backend.dto.refund.RefundRequest;

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
     * Calculate total refund amount needed for a story (both book and chapter
     * purchases)
     */
    RefundCalculationResponse calculateStoryRefundAmount(UUID storyId);

    /**
     * Calculate total refund amount needed for a chapter
     */
    RefundCalculationResponse calculateChapterRefundAmount(UUID chapterId);

    /**
     * Calculate refund amount when changing pricing type from paid to free
     */
    RefundCalculationResponse calculatePricingChangeRefundAmount(UUID storyId, Story.PricingType newPricingType);

    /**
     * Check if pricing type change requires refunds
     */
    boolean pricingChangeRequiresRefund(UUID storyId, Story.PricingType newPricingType);

    /**
     * Check if author has enough coins to refund all buyers
     */
    boolean authorCanAffordRefund(UUID authorId, BigDecimal refundAmount);

    /**
     * Validate if a story can be deleted without refund
     */
    boolean canDeleteStoryWithoutRefund(UUID storyId);

    /**
     * Validate if a chapter can be deleted without refund
     */
    boolean canDeleteChapterWithoutRefund(UUID chapterId);

    /**
     * Validate if a story can be unpublished without refund
     */
    boolean canUnpublishStoryWithoutRefund(UUID storyId);

    /**
     * Validate if a chapter can be unpublished without refund
     */
    boolean canUnpublishChapterWithoutRefund(UUID chapterId);

    /**
     * Validate if a chapter can be moved to trash without refund
     * (only requires refund if published and has purchases)
     */
    boolean canMoveChapterToTrashWithoutRefund(UUID chapterId);

    /**
     * Validate if story pricing can be changed to free without refund
     */
    boolean canChangePricingToFreeWithoutRefund(UUID storyId);

    /**
     * Validate if a story can be moved to trash without refund
     * (only requires refund if published and has purchases)
     */
    boolean canMoveStoryToTrashWithoutRefund(UUID storyId);

    /**
     * Check if user has purchased access to a story in any form
     * (either whole book or individual chapters)
     */
    boolean userHasPurchasedStoryAccess(UUID userId, UUID storyId);

    /**
     * Check if user has purchased a specific chapter
     */
    boolean userHasPurchasedChapter(UUID userId, UUID chapterId);
}