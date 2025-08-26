package com.app.nomanweb_backend.dto.monetization;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentIntentRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.0", message = "Amount must be at least 1 THB")
    private BigDecimal amount;

    @NotNull(message = "Coins amount is required")
    @DecimalMin(value = "1", message = "Coins must be at least 1")
    private BigDecimal coins;

    private UUID packageId; // Optional: if purchasing a specific coin package

    private String currency = "THB"; // Default to Thai Baht

    private String description;
}