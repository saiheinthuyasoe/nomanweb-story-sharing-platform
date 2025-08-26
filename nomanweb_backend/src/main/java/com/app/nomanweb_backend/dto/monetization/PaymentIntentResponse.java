package com.app.nomanweb_backend.dto.monetization;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentIntentResponse {

    private String clientSecret;

    private String paymentIntentId;

    private BigDecimal amount;

    private String currency;

    private String status;

    private String description;
}