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
public class PurchaseHistoryResponse {
    private UUID id;
    private String purchaseType; // "chapter" or "book"
    private UUID storyId;
    private String storyTitle;
    private String storyAuthor;
    private UUID chapterId;
    private String chapterTitle;
    private Integer chapterNumber;
    private BigDecimal amount;
    private LocalDateTime createdAt;
    private String status; // "completed", "pending", "failed"
}