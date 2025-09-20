package com.app.nomanweb_backend.dto.withdraw;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WithdrawRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.0", message = "Minimum withdrawal amount is 1.00")
    private BigDecimal amount;

    @NotBlank(message = "Bank name is required")
    @Size(max = 100, message = "Bank name must not exceed 100 characters")
    private String bankName;

    @NotBlank(message = "Account number is required")
    @Size(max = 50, message = "Account number must not exceed 50 characters")
    private String accountNumber;

    @NotBlank(message = "Account holder name is required")
    @Size(max = 100, message = "Account holder name must not exceed 100 characters")
    private String accountHolderName;

    @Size(max = 20, message = "Routing number must not exceed 20 characters")
    private String routingNumber;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
}