package com.app.nomanweb_backend.dto.monetization;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCheckoutSessionRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.0", message = "Amount must be at least 1 THB")
    private BigDecimal amount;

    @NotNull(message = "Coins amount is required")
    @DecimalMin(value = "1", message = "Coins must be at least 1")
    private BigDecimal coins;

    private UUID packageId; // Optional: if purchasing a specific coin package

    @NotBlank(message = "Success URL is required")
    private String successUrl;

    @NotBlank(message = "Cancel URL is required")
    private String cancelUrl;

    private String currency = "THB"; // Default to Thai Baht
}