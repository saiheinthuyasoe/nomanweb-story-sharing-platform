package com.app.nomanweb_backend.dto.monetization;

import com.app.nomanweb_backend.dto.refund.RefundTransactionResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkMonetizationResponse {
    private RevenueAnalyticsResponse analytics;
    private Page<GiftTransactionResponse> receivedGifts;
    private Page<GiftTransactionResponse> sentGifts;
    private Page<EarnedMoneyResponse> earnedMoney;
    private Page<GiftTransactionResponse> purchaseHistory;
    private Page<RefundTransactionResponse> refundsEarned;
    private Page<RefundTransactionResponse> refundsPaid;
    private BigDecimal coinBalance;
}