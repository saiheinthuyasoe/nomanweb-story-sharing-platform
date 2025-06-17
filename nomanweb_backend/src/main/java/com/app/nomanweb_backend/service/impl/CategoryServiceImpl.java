package com.app.nomanweb_backend.service.impl;

import com.app.nomanweb_backend.dto.category.CategoryResponse;
import com.app.nomanweb_backend.dto.category.CreateCategoryRequest;
import com.app.nomanweb_backend.dto.category.UpdateCategoryRequest;
import com.app.nomanweb_backend.entity.Category;
import com.app.nomanweb_backend.repository.CategoryRepository;
import com.app.nomanweb_backend.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Override
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        log.info("Creating category with name: {}", request.getName());

        // Check if category with same name or slug already exists
        if (categoryRepository.existsByName(request.getName())) {
            throw new RuntimeException("Category with name '" + request.getName() + "' already exists");
        }

        if (categoryRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Category with slug '" + request.getSlug() + "' already exists");
        }

        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .slug(request.getSlug())
                .isActive(request.getIsActive())
                .build();

        category = categoryRepository.save(category);
        log.info("Category created successfully with ID: {}", category.getId());

        return convertToCategoryResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(UUID categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        return convertToCategoryResponse(category);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        return convertToCategoryResponse(category);
    }

    @Override
    public CategoryResponse updateCategory(UUID categoryId, UpdateCategoryRequest request) {
        log.info("Updating category: {}", categoryId);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        // Update fields if provided
        if (request.getName() != null) {
            // Check if name is already taken by another category
            if (!category.getName().equals(request.getName()) &&
                    categoryRepository.existsByName(request.getName())) {
                throw new RuntimeException("Category with name '" + request.getName() + "' already exists");
            }
            category.setName(request.getName());
        }

        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }

        if (request.getSlug() != null) {
            // Check if slug is already taken by another category
            if (!category.getSlug().equals(request.getSlug()) &&
                    categoryRepository.existsBySlug(request.getSlug())) {
                throw new RuntimeException("Category with slug '" + request.getSlug() + "' already exists");
            }
            category.setSlug(request.getSlug());
        }

        if (request.getIsActive() != null) {
            category.setIsActive(request.getIsActive());
        }

        category = categoryRepository.save(category);
        log.info("Category updated successfully: {}", categoryId);

        return convertToCategoryResponse(category);
    }

    @Override
    public void deleteCategory(UUID categoryId) {
        log.info("Deleting category: {}", categoryId);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        // Check if category has stories - if so, don't allow deletion
        if (!category.getStories().isEmpty()) {
            throw new RuntimeException("Cannot delete category with existing stories");
        }

        categoryRepository.delete(category);
        log.info("Category deleted successfully: {}", categoryId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllActiveCategories() {
        List<Category> categories = categoryRepository.findByIsActiveTrueOrderByName();
        return categories.stream()
                .map(this::convertToCategoryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return categories.stream()
                .map(this::convertToCategoryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByName(String name) {
        return categoryRepository.existsByName(name);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsBySlug(String slug) {
        return categoryRepository.existsBySlug(slug);
    }

    // Helper method to convert Category entity to CategoryResponse DTO
    private CategoryResponse convertToCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .slug(category.getSlug())
                .isActive(category.getIsActive())
                .createdAt(category.getCreatedAt())
                .storyCount((long) category.getStories().size())
                .build();
    }
}