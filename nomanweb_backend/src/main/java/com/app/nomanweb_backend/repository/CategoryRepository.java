package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    // Find category by slug
    Optional<Category> findBySlug(String slug);

    // Find category by name
    Optional<Category> findByName(String name);

    // Find all active categories
    List<Category> findByIsActiveTrueOrderByName();

    // Check if category exists by slug
    boolean existsBySlug(String slug);

    // Check if category exists by name
    boolean existsByName(String name);
}