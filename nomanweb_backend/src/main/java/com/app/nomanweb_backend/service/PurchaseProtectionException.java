package com.app.nomanweb_backend.service;

import java.math.BigDecimal;

/**
 * Exception thrown when an action violates purchase protection rules
 */
public class PurchaseProtectionException extends RuntimeException {
    private final String storyId;
    private final String storyTitle;
    private final int totalPurchases;
    private final BigDecimal refundAmount;
    private final boolean requiresRefunds;

    public PurchaseProtectionException(String message, String storyId, String storyTitle,
            int totalPurchases, BigDecimal refundAmount) {
        super(message);
        this.storyId = storyId;
        this.storyTitle = storyTitle;
        this.totalPurchases = totalPurchases;
        this.refundAmount = refundAmount;
        this.requiresRefunds = totalPurchases > 0;
    }

    public String getStoryId() {
        return storyId;
    }

    public String getStoryTitle() {
        return storyTitle;
    }

    public int getTotalPurchases() {
        return totalPurchases;
    }

    public BigDecimal getRefundAmount() {
        return refundAmount;
    }

    public boolean requiresRefunds() {
        return requiresRefunds;
    }
}