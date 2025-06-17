package com.app.nomanweb_backend.dto.chapter;

import com.app.nomanweb_backend.entity.Chapter;
import lombok.Data;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ChapterPreviewResponse {

    private UUID id;
    private Integer chapterNumber;
    private String title;
    private Integer wordCount;
    private BigDecimal coinPrice;
    private Boolean isFree;
    private Chapter.Status status;

    // Statistics
    private Long views;
    private Long likes;

    // Reading time estimate (minutes)
    private Integer estimatedReadingTime;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime publishedAt;
}