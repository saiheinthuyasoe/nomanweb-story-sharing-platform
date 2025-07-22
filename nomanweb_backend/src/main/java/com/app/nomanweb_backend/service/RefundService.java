package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.refund.RefundRequest;
import com.app.nomanweb_backend.dto.refund.RefundCalculationResponse;
import com.app.nomanweb_backend.entity.RefundTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface RefundService {

    /**
     * Process refund for story deletion/unpublishing
     */
    List<RefundTransaction> processStoryRefund(UUID storyId, UUID authorId, RefundRequest.RefundType refundType,
            String reason);

    /**
     * Process refund for chapter deletion/unpublishing
     */
    List<RefundTransaction> processChapterRefund(UUID chapterId, UUID authorId, RefundRequest.RefundType refundType,
            String reason);

    /**
     * Execute approved refund transactions
     */
    void executeRefund(UUID refundTransactionId);

    /**
     * Approve refund transaction (admin only)
     */
    RefundTransaction approveRefund(UUID refundTransactionId, UUID adminId);

    /**
     * Reject refund transaction (admin only)
     */
    RefundTransaction rejectRefund(UUID refundTransactionId, UUID adminId, String reason);

    /**
     * Get refund transactions for author
     */
    Page<RefundTransaction> getAuthorRefunds(UUID authorId, Pageable pageable);

    /**
     * Get refund transactions for buyer
     */
    Page<RefundTransaction> getBuyerRefunds(UUID buyerId, Pageable pageable);

    /**
     * Get pending refunds for admin approval
     */
    Page<RefundTransaction> getPendingRefunds(Pageable pageable);

    /**
     * Get refund by ID
     */
    RefundTransaction getRefundById(UUID refundId);

    /**
     * Calculate refund amount for story
     */
    RefundCalculationResponse calculateStoryRefund(UUID storyId);

    /**
     * Calculate refund amount for chapter
     */
    RefundCalculationResponse calculateChapterRefund(UUID chapterId);
}