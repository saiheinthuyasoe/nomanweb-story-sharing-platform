package com.app.nomanweb_backend.service;

import com.app.nomanweb_backend.dto.category.CategoryResponse;
import com.app.nomanweb_backend.dto.category.CreateCategoryRequest;
import com.app.nomanweb_backend.dto.category.UpdateCategoryRequest;

import java.util.List;
import java.util.UUID;

public interface CategoryService {

    // Basic CRUD operations
    CategoryResponse createCategory(CreateCategoryRequest request);

    CategoryResponse getCategoryById(UUID categoryId);

    CategoryResponse getCategoryBySlug(String slug);

    CategoryResponse updateCategory(UUID categoryId, UpdateCategoryRequest request);

    void deleteCategory(UUID categoryId);

    // Category listing
    List<CategoryResponse> getAllActiveCategories();

    List<CategoryResponse> getAllCategories();

    // Validation
    boolean existsByName(String name);

    boolean existsBySlug(String slug);
}