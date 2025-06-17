package com.app.nomanweb_backend.dto.story;

import com.app.nomanweb_backend.entity.Story;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateStoryRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    private UUID categoryId;

    private Story.ContentType contentType = Story.ContentType.FREE;

    private List<String> tags;

    private String coverImageUrl;
}