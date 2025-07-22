package com.app.nomanweb_backend.dto.refund;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundCalculationResponse {

    private BigDecimal totalRefundAmount;
    private int totalBuyersCount;
    private List<RefundItem> refundItems;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RefundItem {
        private String buyerUsername;
        private String buyerEmail;
        private String itemType; // "BOOK" or "CHAPTER"
        private String itemTitle;
        private BigDecimal refundAmount;
        private String purchaseDate;
    }
}