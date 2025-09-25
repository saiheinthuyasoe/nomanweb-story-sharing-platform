package com.app.nomanweb_backend.dto.rating;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoryRatingResponse {

    private UUID id;
    private UUID userId;
    private String username;
    private UUID storyId;
    private Integer rating;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}