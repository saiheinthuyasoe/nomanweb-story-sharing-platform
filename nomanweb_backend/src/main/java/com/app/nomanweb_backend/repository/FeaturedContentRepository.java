package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.FeaturedContent;
import com.app.nomanweb_backend.entity.Story;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeaturedContentRepository extends JpaRepository<FeaturedContent, UUID> {

       // Find active featured content by section type
       @Query("SELECT fc FROM FeaturedContent fc " +
                     "WHERE fc.sectionType = :sectionType " +
                     "AND fc.isActive = true " +
                     "AND (fc.startDate IS NULL OR fc.startDate <= :now) " +
                     "AND (fc.endDate IS NULL OR fc.endDate >= :now) " +
                     "ORDER BY fc.displayOrder ASC, fc.createdAt DESC")
       List<FeaturedContent> findActiveBySectionType(
                     @Param("sectionType") FeaturedContent.SectionType sectionType,
                     @Param("now") LocalDateTime now);

       // Find active featured content by section type with pagination
       @Query("SELECT fc FROM FeaturedContent fc " +
                     "WHERE fc.sectionType = :sectionType " +
                     "AND fc.isActive = true " +
                     "AND (fc.startDate IS NULL OR fc.startDate <= :now) " +
                     "AND (fc.endDate IS NULL OR fc.endDate >= :now) " +
                     "ORDER BY fc.displayOrder ASC, fc.createdAt DESC")
       Page<FeaturedContent> findActiveBySectionType(
                     @Param("sectionType") FeaturedContent.SectionType sectionType,
                     @Param("now") LocalDateTime now,
                     Pageable pageable);

       // Find all featured content by section type (including inactive)
       List<FeaturedContent> findBySectionTypeOrderByDisplayOrderAscCreatedAtDesc(
                     FeaturedContent.SectionType sectionType);

       // Find featured content by section type with pagination (including inactive)
       Page<FeaturedContent> findBySectionTypeOrderByDisplayOrderAscCreatedAtDesc(
                     FeaturedContent.SectionType sectionType, Pageable pageable);

       // Check if story is already featured in a section
       boolean existsByStoryAndSectionTypeAndIsActive(Story story, FeaturedContent.SectionType sectionType,
                     Boolean isActive);

       // Find featured content by story and section
       Optional<FeaturedContent> findByStoryAndSectionType(Story story, FeaturedContent.SectionType sectionType);

       // Find all featured content for a story
       List<FeaturedContent> findByStoryOrderByCreatedAtDesc(Story story);

       // Count active featured content by section
       @Query("SELECT COUNT(fc) FROM FeaturedContent fc " +
                     "WHERE fc.sectionType = :sectionType " +
                     "AND fc.isActive = true " +
                     "AND (fc.startDate IS NULL OR fc.startDate <= :now) " +
                     "AND (fc.endDate IS NULL OR fc.endDate >= :now)")
       long countActiveBySectionType(
                     @Param("sectionType") FeaturedContent.SectionType sectionType,
                     @Param("now") LocalDateTime now);

       // Find expired featured content
       @Query("SELECT fc FROM FeaturedContent fc " +
                     "WHERE fc.isActive = true " +
                     "AND fc.endDate IS NOT NULL " +
                     "AND fc.endDate < :now")
       List<FeaturedContent> findExpiredContent(@Param("now") LocalDateTime now);

       // Find featured content by creator
       List<FeaturedContent> findByCreatedByOrderByCreatedAtDesc(com.app.nomanweb_backend.entity.User createdBy);

       // Get next display order for a section
       @Query("SELECT COALESCE(MAX(fc.displayOrder), 0) + 1 FROM FeaturedContent fc " +
                     "WHERE fc.sectionType = :sectionType")
       Integer getNextDisplayOrder(@Param("sectionType") FeaturedContent.SectionType sectionType);

       // Find featured content that needs to be activated (start date reached)
       @Query("SELECT fc FROM FeaturedContent fc " +
                     "WHERE fc.isActive = false " +
                     "AND fc.startDate IS NOT NULL " +
                     "AND fc.startDate <= :now")
       List<FeaturedContent> findContentToActivate(@Param("now") LocalDateTime now);
}