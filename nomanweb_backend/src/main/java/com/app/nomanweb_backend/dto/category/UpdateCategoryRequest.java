package com.app.nomanweb_backend.dto.category;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateCategoryRequest {

    @Size(max = 100, message = "Category name must not exceed 100 characters")
    private String name;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @Size(max = 100, message = "Slug must not exceed 100 characters")
    private String slug;

    private Boolean isActive;
}