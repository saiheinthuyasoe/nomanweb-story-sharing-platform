package com.app.nomanweb_backend.dto.category;

import lombok.Data;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class CategoryResponse {

    private UUID id;
    private String name;
    private String description;
    private String slug;
    private Boolean isActive;
    private LocalDateTime createdAt;

    // Optional statistics
    private Long storyCount;
}