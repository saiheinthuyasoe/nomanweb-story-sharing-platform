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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoryRepository extends JpaRepository<Story, UUID> {

    // Find stories by author
    Page<Story> findByAuthor(User author, Pageable pageable);

    // Find stories by author and status
    Page<Story> findByAuthorAndStatus(User author, Story.Status status, Pageable pageable);

    // Find published stories ordered by creation date
    Page<Story> findByStatusOrderByCreatedAtDesc(Story.Status status, Pageable pageable);

    // Find stories by category
    Page<Story> findByCategoryAndStatus(Category category, Story.Status status, Pageable pageable);

    // Find featured stories
    Page<Story> findByIsFeaturedTrueAndStatus(Story.Status status, Pageable pageable);

    // Find stories by moderation status
    Page<Story> findByModerationStatus(Story.ModerationStatus moderationStatus, Pageable pageable);

    // Search stories by title or description
    @Query("SELECT s FROM Story s WHERE s.status = :status AND " +
            "(LOWER(s.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(s.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Story> searchByTitleOrDescription(@Param("query") String query,
            @Param("status") Story.Status status,
            Pageable pageable);

    // Find trending stories (most views in recent time)
    @Query("SELECT s FROM Story s WHERE s.status = :status " +
            "ORDER BY s.totalViews DESC, s.createdAt DESC")
    Page<Story> findTrendingStories(@Param("status") Story.Status status, Pageable pageable);

    // Find popular stories (most likes)
    @Query("SELECT s FROM Story s WHERE s.status = :status " +
            "ORDER BY s.totalLikes DESC, s.createdAt DESC")
    Page<Story> findPopularStories(@Param("status") Story.Status status, Pageable pageable);

    // Count stories by author
    long countByAuthor(User author);

    // Count published stories by author
    long countByAuthorAndStatus(User author, Story.Status status);

    // Find stories with specific content type
    Page<Story> findByContentTypeAndStatus(Story.ContentType contentType,
            Story.Status status,
            Pageable pageable);

    // Custom query for complex filtering
    @Query("SELECT s FROM Story s WHERE " +
            "(:status IS NULL OR s.status = :status) AND " +
            "(:categoryId IS NULL OR s.category.id = :categoryId) AND " +
            "(:contentType IS NULL OR s.contentType = :contentType) AND " +
            "(:authorId IS NULL OR s.author.id = :authorId)")
    Page<Story> findStoriesWithFilters(@Param("status") Story.Status status,
            @Param("categoryId") UUID categoryId,
            @Param("contentType") Story.ContentType contentType,
            @Param("authorId") UUID authorId,
            Pageable pageable);
}