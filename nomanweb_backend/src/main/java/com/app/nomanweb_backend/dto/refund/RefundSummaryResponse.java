package com.app.nomanweb_backend.dto.refund;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundSummaryResponse {
    private BigDecimal totalRefundsReceived;
    private BigDecimal totalRefundsGiven;
    private BigDecimal monthlyRefundsReceived;
    private BigDecimal monthlyRefundsGiven;
    private List<RefundTransactionResponse> recentRefunds;
}