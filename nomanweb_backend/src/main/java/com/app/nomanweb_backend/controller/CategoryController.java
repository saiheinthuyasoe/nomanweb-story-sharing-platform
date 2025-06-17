package com.app.nomanweb_backend.controller;

import com.app.nomanweb_backend.dto.category.CategoryResponse;
import com.app.nomanweb_backend.dto.category.CreateCategoryRequest;
import com.app.nomanweb_backend.dto.category.UpdateCategoryRequest;
import com.app.nomanweb_backend.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
@Slf4j
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getCategories() {
        try {
            List<CategoryResponse> categories = categoryService.getAllActiveCategories();
            return ResponseEntity.ok(categories);
        } catch (RuntimeException e) {
            log.error("Error getting categories: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategory(@PathVariable UUID id) {
        try {
            CategoryResponse category = categoryService.getCategoryById(id);
            return ResponseEntity.ok(category);
        } catch (RuntimeException e) {
            log.error("Error getting category {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<CategoryResponse> getCategoryBySlug(@PathVariable String slug) {
        try {
            CategoryResponse category = categoryService.getCategoryBySlug(slug);
            return ResponseEntity.ok(category);
        } catch (RuntimeException e) {
            log.error("Error getting category by slug {}: {}", slug, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // Admin endpoints for managing categories
    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        try {
            CategoryResponse response = categoryService.createCategory(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            log.error("Error creating category: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        try {
            CategoryResponse response = categoryService.updateCategory(id, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error updating category {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        try {
            categoryService.deleteCategory(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting category {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}