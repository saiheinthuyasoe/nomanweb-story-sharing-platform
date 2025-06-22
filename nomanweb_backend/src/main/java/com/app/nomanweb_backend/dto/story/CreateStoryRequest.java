package com.app.nomanweb_backend.dto.story;

import com.app.nomanweb_backend.entity.Story;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateStoryRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    private UUID categoryId;

    @Builder.Default
    private Story.ContentType contentType = Story.ContentType.FREE;

    @Builder.Default
    private Story.ContentStatus contentStatus = Story.ContentStatus.ONGOING;

    private List<String> tags;

    private String coverImageUrl;
}