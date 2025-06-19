package com.app.nomanweb_backend.dto.chapter;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateChapterRequest {

    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String content;

    @DecimalMin(value = "0.0", inclusive = true, message = "Coin price must be non-negative")
    @Digits(integer = 6, fraction = 2, message = "Invalid coin price format")
    private BigDecimal coinPrice;

    private Boolean isFree;

    @Min(value = 1, message = "Chapter number must be positive")
    private Integer chapterNumber;

    // Publish/Draft toggle
    private Boolean shouldPublish;

    // Auto-save support
    private Boolean isAutoSave = false;
}