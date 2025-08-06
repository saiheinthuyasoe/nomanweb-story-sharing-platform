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
public class EarnedMoneyResponse {
    private UUID id;
    private String transactionType; // "chapter_purchase" or "story_purchase"
    private BigDecimal amount;
    private String readerName;
    private String readerUsername;
    private String storyTitle;
    private String chapterTitle;
    private Integer chapterNumber;
    private LocalDateTime createdAt;
    private BigDecimal commission; // Platform commission percentage
    private BigDecimal netEarnings; // Amount after commission
}