-- Performance Indexes for Stories Table
-- These indexes will significantly improve query performance for common operations

-- Index for total_views (used for sorting popular stories)
CREATE INDEX IF NOT EXISTS idx_stories_total_views ON stories (total_views DESC);

-- Index for total_likes (used for sorting liked stories)
CREATE INDEX IF NOT EXISTS idx_stories_total_likes ON stories (total_likes DESC);

-- Index for created_at (used for sorting by newest stories)
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories (created_at DESC);

-- Index for updated_at (used for sorting by recently updated)
CREATE INDEX IF NOT EXISTS idx_stories_updated_at ON stories (updated_at DESC);

-- Index for published_at (used for sorting published stories)
CREATE INDEX IF NOT EXISTS idx_stories_published_at ON stories (published_at DESC);

-- Composite index for publish_status and created_at (very common query pattern)
CREATE INDEX IF NOT EXISTS idx_stories_publish_status_created_at ON stories (publish_status, created_at DESC);

-- Composite index for author_id and publish_status (for author's published stories)
CREATE INDEX IF NOT EXISTS idx_stories_author_publish_status ON stories (author_id, publish_status);

-- Composite index for category_id and publish_status (for category browsing)
CREATE INDEX IF NOT EXISTS idx_stories_category_publish_status ON stories (category_id, publish_status);

-- Index for moderation_status (for admin dashboard)
CREATE INDEX IF NOT EXISTS idx_stories_moderation_status ON stories (moderation_status);

-- Index for is_featured (for featured content queries)
CREATE INDEX IF NOT EXISTS idx_stories_is_featured ON stories (is_featured);

-- Index for is_deleted (to exclude deleted stories efficiently)
CREATE INDEX IF NOT EXISTS idx_stories_is_deleted ON stories (is_deleted);

-- Composite index for trending stories (views + likes + recent)
CREATE INDEX IF NOT EXISTS idx_stories_trending ON stories (publish_status, total_views DESC, total_likes DESC, created_at DESC) 
WHERE is_deleted = false OR is_deleted IS NULL;

-- Performance Indexes for Related Tables

-- Library table indexes (for user reading lists)
CREATE INDEX IF NOT EXISTS idx_libraries_user_id ON libraries (user_id);
CREATE INDEX IF NOT EXISTS idx_libraries_story_id ON libraries (story_id);
CREATE INDEX IF NOT EXISTS idx_libraries_list_type ON libraries (list_type);
CREATE INDEX IF NOT EXISTS idx_libraries_user_list_type ON libraries (user_id, list_type);
CREATE INDEX IF NOT EXISTS idx_libraries_added_at ON libraries (added_at DESC);

-- Story views table indexes
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views (story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_user_id ON story_views (user_id);
CREATE INDEX IF NOT EXISTS idx_story_views_last_viewed_at ON story_views (last_viewed_at DESC);

-- Reactions table indexes
CREATE INDEX IF NOT EXISTS idx_reactions_target_type_target_id ON reactions (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions (user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_created_at ON reactions (created_at DESC);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read ON notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

-- Featured content table indexes
CREATE INDEX IF NOT EXISTS idx_featured_content_story_id ON featured_content (story_id);
CREATE INDEX IF NOT EXISTS idx_featured_content_section_type ON featured_content (section_type);
CREATE INDEX IF NOT EXISTS idx_featured_content_is_active ON featured_content (is_active);
CREATE INDEX IF NOT EXISTS idx_featured_content_display_order ON featured_content (display_order);
CREATE INDEX IF NOT EXISTS idx_featured_content_active_section ON featured_content (section_type, is_active, display_order);

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories (is_active);

-- Story ratings table indexes
CREATE INDEX IF NOT EXISTS idx_story_ratings_story_id ON story_ratings (story_id);
CREATE INDEX IF NOT EXISTS idx_story_ratings_rating ON story_ratings (rating);
CREATE INDEX IF NOT EXISTS idx_story_ratings_created_at ON story_ratings (created_at DESC);