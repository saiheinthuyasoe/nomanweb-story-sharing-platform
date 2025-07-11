package com.app.nomanweb_backend.repository;

import com.app.nomanweb_backend.entity.Story;
import com.app.nomanweb_backend.entity.User;
import com.app.nomanweb_backend.entity.Category;
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
public interface StoryRepository extends JpaRepository<Story, UUID> {

        // Find stories by author (excluding deleted)
        @Query("SELECT s FROM Story s WHERE s.author = :author AND (s.isDeleted = false OR s.isDeleted IS NULL) ORDER BY s.updatedAt DESC")
        Page<Story> findByAuthor(@Param("author") User author, Pageable pageable);

        // Find stories by author and publish status
        Page<Story> findByAuthorAndPublishStatus(User author, Story.PublishStatus publishStatus, Pageable pageable);

        // Find published stories ordered by creation date
        Page<Story> findByPublishStatusOrderByCreatedAtDesc(Story.PublishStatus publishStatus, Pageable pageable);

        // Find stories by category
        Page<Story> findByCategoryAndPublishStatus(Category category, Story.PublishStatus publishStatus,
                        Pageable pageable);

        // Find featured stories
        Page<Story> findByIsFeaturedTrueAndPublishStatus(Story.PublishStatus publishStatus, Pageable pageable);

        // Find stories by moderation status
        Page<Story> findByModerationStatus(Story.ModerationStatus moderationStatus, Pageable pageable);

        // Search stories by title, description, or author name
        @Query("SELECT s FROM Story s WHERE s.publishStatus = :publishStatus AND " +
                        "(LOWER(s.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                        "LOWER(s.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                        "LOWER(s.author.displayName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
                        "LOWER(s.author.username) LIKE LOWER(CONCAT('%', :query, '%')))")
        Page<Story> searchByTitleOrDescription(@Param("query") String query,
                        @Param("publishStatus") Story.PublishStatus publishStatus,
                        Pageable pageable);

        // Find trending stories (most views in recent time)
        @Query("SELECT s FROM Story s WHERE s.publishStatus = :publishStatus " +
                        "ORDER BY s.totalViews DESC, s.createdAt DESC")
        Page<Story> findTrendingStories(@Param("publishStatus") Story.PublishStatus publishStatus, Pageable pageable);

        // Find popular stories (most likes)
        @Query("SELECT s FROM Story s WHERE s.publishStatus = :publishStatus " +
                        "ORDER BY s.totalLikes DESC, s.createdAt DESC")
        Page<Story> findPopularStories(@Param("publishStatus") Story.PublishStatus publishStatus, Pageable pageable);

        // Count stories by author
        long countByAuthor(User author);

        // Count published stories by author
        long countByAuthorAndPublishStatus(User author, Story.PublishStatus publishStatus);

        // Count published stories by author ID
        @Query("SELECT COUNT(s) FROM Story s WHERE s.author.id = :userId AND s.publishStatus = 'PUBLISHED'")
        long countByAuthorIdAndPublishStatus(@Param("userId") UUID userId,
                        @Param("publishStatus") String publishStatus);

        // Get total views for an author
        @Query("SELECT COALESCE(SUM(s.totalViews), 0) FROM Story s WHERE s.author.id = :userId AND s.publishStatus = 'PUBLISHED'")
        long getTotalViewsByAuthor(@Param("userId") UUID userId);

        // Get total likes for an author
        @Query("SELECT COALESCE(SUM(s.totalLikes), 0) FROM Story s WHERE s.author.id = :userId AND s.publishStatus = 'PUBLISHED'")
        long getTotalLikesByAuthor(@Param("userId") UUID userId);

        // Count stories by moderation status
        long countByModerationStatus(Story.ModerationStatus moderationStatus);

        // Count stories created after a specific date
        long countByCreatedAtAfter(LocalDateTime date);

        // Find stories with specific content type
        Page<Story> findByPricingTypeAndPublishStatus(Story.PricingType pricingType,
                        Story.PublishStatus publishStatus,
                        Pageable pageable);

        // Custom query for complex filtering
        @Query("SELECT s FROM Story s WHERE " +
                        "(:publishStatus IS NULL OR s.publishStatus = :publishStatus) AND " +
                        "(:categoryId IS NULL OR s.category.id = :categoryId) AND " +
                        "(:pricingType IS NULL OR s.pricingType = :pricingType) AND " +
                        "(:bookStatus IS NULL OR s.bookStatus = :bookStatus) AND " +
                        "(:authorId IS NULL OR s.author.id = :authorId)")
        Page<Story> findStoriesWithFilters(@Param("publishStatus") Story.PublishStatus publishStatus,
                        @Param("categoryId") UUID categoryId,
                        @Param("pricingType") Story.PricingType pricingType,
                        @Param("bookStatus") Story.BookStatus bookStatus,
                        @Param("authorId") UUID authorId,
                        Pageable pageable);

        // Trash-related queries

        // Find stories in trash by author
        @Query("SELECT s FROM Story s WHERE s.author = :author AND s.isDeleted = true ORDER BY s.deletedAt DESC")
        List<Story> findTrashByAuthor(@Param("author") User author);

        // Find all stories by author including deleted (for author management)
        @Query("SELECT s FROM Story s WHERE s.author = :author ORDER BY s.isDeleted ASC, s.createdAt DESC")
        List<Story> findAllByAuthorIncludingDeleted(@Param("author") User author);

        // Find all stories by author including deleted with pagination (for author
        // management)
        @Query("SELECT s FROM Story s WHERE s.author = :author ORDER BY s.isDeleted ASC, s.updatedAt DESC")
        Page<Story> findAllByAuthorIncludingDeleted(@Param("author") User author, Pageable pageable);

        // Count stories in trash by author
        @Query("SELECT COUNT(s) FROM Story s WHERE s.author = :author AND s.isDeleted = true")
        long countTrashByAuthor(@Param("author") User author);

        // Find stories in trash older than specified date (for cleanup)
        @Query("SELECT s FROM Story s WHERE s.isDeleted = true AND s.deletedAt < :cutoffDate")
        List<Story> findTrashOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

        // Find stories with total views greater than specified value
        List<Story> findByTotalViewsGreaterThan(Long totalViews);
}