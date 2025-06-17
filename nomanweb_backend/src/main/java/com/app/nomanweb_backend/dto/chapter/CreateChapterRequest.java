package com.app.nomanweb_backend.dto.chapter;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateChapterRequest {

    @NotNull(message = "Story ID is required")
    private UUID storyId;

    @NotBlank(message = "Chapter title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @NotBlank(message = "Chapter content is required")
    @Size(min = 50, message = "Chapter content must be at least 50 characters")
    private String content;

    @Min(value = 1, message = "Chapter number must be positive")
    private Integer chapterNumber;

    @DecimalMin(value = "0.0", inclusive = true, message = "Coin price must be non-negative")
    @Digits(integer = 6, fraction = 2, message = "Invalid coin price format")
    private BigDecimal coinPrice = BigDecimal.ZERO;

    private Boolean isFree = true;

    // Auto-save functionality
    private Boolean isDraft = true;
}