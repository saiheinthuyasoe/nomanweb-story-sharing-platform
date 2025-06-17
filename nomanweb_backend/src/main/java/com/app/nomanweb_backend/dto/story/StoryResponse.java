package com.app.nomanweb_backend.dto.story;

import com.app.nomanweb_backend.entity.Story;
import lombok.Data;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class StoryResponse {

    private UUID id;
    private String title;
    private String description;
    private String coverImageUrl;

    // Author information
    private AuthorInfo author;

    // Category information
    private CategoryInfo category;

    private Story.Status status;
    private Story.ContentType contentType;
    private Story.ModerationStatus moderationStatus;

    // Statistics
    private Integer totalChapters;
    private Long totalViews;
    private Long totalLikes;
    private Long totalComments;
    private BigDecimal totalCoinsEarned;

    private Boolean isFeatured;
    private List<String> tags;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;

    @Data
    @Builder
    public static class AuthorInfo {
        private UUID id;
        private String username;
        private String displayName;
        private String profileImageUrl;
    }

    @Data
    @Builder
    public static class CategoryInfo {
        private UUID id;
        private String name;
        private String slug;
        private String description;
    }
}