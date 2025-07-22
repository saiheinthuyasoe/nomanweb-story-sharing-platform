package com.app.nomanweb_backend.dto.monetization;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiftTransactionResponse {
    private UUID id;
    private GiftResponse gift;
    private UserSummary sender;
    private UserSummary recipient;
    private StorySummary story; // Optional
    private ChapterSummary chapter; // Optional
    private Integer quantity;
    private BigDecimal totalCoins;
    private String message;
    private LocalDateTime createdAt;
    private Integer chaptersAtPurchase; // For book purchases, track chapters at purchase time

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private UUID id;
        private String username;
        private String displayName;
        private String profileImageUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StorySummary {
        private UUID id;
        private String title;
        private String coverImageUrl;
        private String pricingType; // Add pricing type to help frontend determine display
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChapterSummary {
        private UUID id;
        private String title;
        private Integer chapterNumber;
    }
}