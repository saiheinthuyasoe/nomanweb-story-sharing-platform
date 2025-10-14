package com.app.nomanweb_backend.service;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
public class DatabaseIndexService {

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${app.database.create-indexes:true}")
    private boolean createIndexes;

    @PostConstruct
    @Transactional
    public void createPerformanceIndexes() {
        if (!createIndexes) {
            log.info("Database index creation is disabled");
            return;
        }

        log.info("Creating performance indexes for database optimization...");

        List<String> indexQueries = Arrays.asList(
            // Stories table indexes
            "CREATE INDEX IF NOT EXISTS idx_stories_total_views ON stories (total_views DESC)",
            "CREATE INDEX IF NOT EXISTS idx_stories_total_likes ON stories (total_likes DESC)",
            "CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories (created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_stories_updated_at ON stories (updated_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_stories_published_at ON stories (published_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_stories_publish_status_created_at ON stories (publish_status, created_at DESC)",
            "CREATE INDEX IF NOT EXISTS idx_stories_author_publish_status ON stories (author_id, publish_status)",
            "CREATE INDEX IF NOT EXISTS idx_stories_category_publish_status ON stories (category_id, publish_status)",
            "CREATE INDEX IF NOT EXISTS idx_stories_moderation_status ON stories (moderation_status)",
            "CREATE INDEX IF NOT EXISTS idx_stories_is_featured ON stories (is_featured)",
            "CREATE INDEX IF NOT EXISTS idx_stories_is_deleted ON stories (is_deleted)",

            // Library table indexes
            "CREATE INDEX IF NOT EXISTS idx_libraries_user_id ON libraries (user_id)",
            "CREATE INDEX IF NOT EXISTS idx_libraries_story_id ON libraries (story_id)",
            "CREATE INDEX IF NOT EXISTS idx_libraries_list_type ON libraries (list_type)",
            "CREATE INDEX IF NOT EXISTS idx_libraries_user_list_type ON libraries (user_id, list_type)",
            "CREATE INDEX IF NOT EXISTS idx_libraries_added_at ON libraries (added_at DESC)",

            // Story views table indexes
            "CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views (story_id)",
            "CREATE INDEX IF NOT EXISTS idx_story_views_user_id ON story_views (user_id)",
            "CREATE INDEX IF NOT EXISTS idx_story_views_last_viewed_at ON story_views (last_viewed_at DESC)",

            // Reactions table indexes
            "CREATE INDEX IF NOT EXISTS idx_reactions_target_type_target_id ON reactions (target_type, target_id)",
            "CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions (user_id)",
            "CREATE INDEX IF NOT EXISTS idx_reactions_created_at ON reactions (created_at DESC)",

            // Notifications table indexes
            "CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id)",
            "CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read)",
            "CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read ON notifications (user_id, is_read)",
            "CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC)",

            // Featured content table indexes
            "CREATE INDEX IF NOT EXISTS idx_featured_content_story_id ON featured_content (story_id)",
            "CREATE INDEX IF NOT EXISTS idx_featured_content_section_type ON featured_content (section_type)",
            "CREATE INDEX IF NOT EXISTS idx_featured_content_is_active ON featured_content (is_active)",
            "CREATE INDEX IF NOT EXISTS idx_featured_content_display_order ON featured_content (display_order)",
            "CREATE INDEX IF NOT EXISTS idx_featured_content_active_section ON featured_content (section_type, is_active, display_order)",

            // Categories table indexes
            "CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug)",
            "CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories (is_active)",

            // Story ratings table indexes
            "CREATE INDEX IF NOT EXISTS idx_story_ratings_story_id ON story_ratings (story_id)",
            "CREATE INDEX IF NOT EXISTS idx_story_ratings_rating ON story_ratings (rating)",
            "CREATE INDEX IF NOT EXISTS idx_story_ratings_created_at ON story_ratings (created_at DESC)"
        );

        int successCount = 0;
        int errorCount = 0;

        for (String query : indexQueries) {
            try {
                entityManager.createNativeQuery(query).executeUpdate();
                successCount++;
                log.debug("Successfully created index: {}", extractIndexName(query));
            } catch (Exception e) {
                errorCount++;
                log.warn("Failed to create index: {} - Error: {}", extractIndexName(query), e.getMessage());
            }
        }

        log.info("Database index creation completed. Success: {}, Errors: {}", successCount, errorCount);
    }

    private String extractIndexName(String query) {
        try {
            String[] parts = query.split("\\s+");
            for (int i = 0; i < parts.length - 1; i++) {
                if ("EXISTS".equals(parts[i])) {
                    return parts[i + 1];
                }
            }
            return "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
}