package com.app.nomanweb_backend.dto.story;

import com.app.nomanweb_backend.entity.Story;
import lombok.Data;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class StoryPreviewResponse {

    private UUID id;
    private String title;
    private String description;
    private String coverImageUrl;

    // Author information (minimal)
    private AuthorInfo author;

    // Category information (minimal)
    private CategoryInfo category;

    private Story.Status status;
    private Story.ContentType contentType;

    // Key statistics
    private Integer totalChapters;
    private Long totalViews;
    private Long totalLikes;

    private Boolean isFeatured;
    private List<String> tags;

    private LocalDateTime createdAt;
    private LocalDateTime publishedAt;

    @Data
    @Builder
    public static class AuthorInfo {
        private UUID id;
        private String username;
        private String displayName;
    }

    @Data
    @Builder
    public static class CategoryInfo {
        private UUID id;
        private String name;
        private String slug;
    }
}