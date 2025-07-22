package com.app.nomanweb_backend.dto.monetization;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendGiftRequest {

    private String giftId; // Can be UUID for predefined gifts or string for emoji/custom gifts

    @Positive(message = "Custom amount must be positive")
    private BigDecimal customAmount; // For custom coin amounts

    @NotNull(message = "Recipient ID is required")
    private UUID recipientId;

    private UUID storyId; // Optional - if gift is for a story

    private UUID chapterId; // Optional - if gift is for a chapter

    @Positive(message = "Quantity must be positive")
    @Builder.Default
    private Integer quantity = 1;

    @Size(max = 500, message = "Message cannot exceed 500 characters")
    private String message;
}