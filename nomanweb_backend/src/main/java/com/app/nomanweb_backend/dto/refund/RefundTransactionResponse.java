package com.app.nomanweb_backend.dto.refund;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundTransactionResponse {
    private UUID id;
    private UUID userId;
    private UUID authorId;
    private UUID storyId;
    private String storyTitle;
    private UUID chapterId;
    private String chapterTitle;
    private Integer chapterNumber;
    private String refundType;
    private String originalPurchaseType;
    private BigDecimal refundAmount;
    private BigDecimal originalAmount;
    private String refundReason;
    private String status;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
}