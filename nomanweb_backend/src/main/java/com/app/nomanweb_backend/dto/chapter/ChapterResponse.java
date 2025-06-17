package com.app.nomanweb_backend.dto.chapter;

import com.app.nomanweb_backend.entity.Chapter;
import lombok.Data;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ChapterResponse {

    private UUID id;
    private Integer chapterNumber;
    private String title;
    private String content;
    private Integer wordCount;
    private BigDecimal coinPrice;
    private Boolean isFree;
    private Chapter.Status status;
    private Chapter.ModerationStatus moderationStatus;
    private String moderationNotes;

    // Story information (minimal)
    private StoryInfo story;

    // Statistics
    private Long views;
    private Long likes;

    // Navigation info
    private NavigationInfo navigation;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;

    @Data
    @Builder
    public static class StoryInfo {
        private UUID id;
        private String title;
        private String authorUsername;
        private Integer totalChapters;
    }

    @Data
    @Builder
    public static class NavigationInfo {
        private Integer previousChapterNumber;
        private Integer nextChapterNumber;
        private Boolean hasNext;
        private Boolean hasPrevious;
        private Integer totalChapters;
    }
}