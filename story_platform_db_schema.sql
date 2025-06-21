-- Story Sharing Platform Database Schema
-- Optimized for production with proper indexing and relationships

-- User Management Tables
    CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        password_hash VARCHAR(255), -- NULL for OAuth users
        profile_image_url TEXT,
        bio TEXT,
        role ENUM('user', 'admin') DEFAULT 'user',
        status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
        3DECIMAL(10,2) DEFAULT 0.00,
        total_earned_coins DECIMAL(10,2) DEFAULT 0.00,
        line_user_id VARCHAR(100), -- For LINE integration
        google_id VARCHAR(100), -- For Google OAuth
        email_verified BOOLEAN DEFAULT FALSE,
        password_reset_token VARCHAR(255), -- For password reset
        password_reset_expires TIMESTAMP NULL, -- Token expiration
        last_password_change TIMESTAMP NULL, -- Track password changes
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_users_email (email),
        INDEX idx_users_username (username),
        INDEX idx_users_role (role),
        INDEX idx_users_status (status),
        INDEX idx_users_line_id (line_user_id),
        INDEX idx_users_google_id (google_id),
        INDEX idx_users_reset_token (password_reset_token)
    );

-- Password Reset Attempts (Security tracking)
CREATE TABLE password_reset_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45), -- Support IPv6
    user_agent TEXT,
    token_generated BOOLEAN DEFAULT FALSE,
    success BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_reset_attempts_email (email),
    INDEX idx_reset_attempts_ip (ip_address),
    INDEX idx_reset_attempts_created (created_at)
);

-- Email Verification Tokens
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_verification_token (token),
    INDEX idx_verification_user (user_id),
    INDEX idx_verification_expires (expires_at)
);

-- User Relationships (Follow/Unfollow)
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id)
);

-- Categories and Genres
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    slug VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_categories_slug (slug),
    INDEX idx_categories_active (is_active)
);

-- Main Stories/Books Table
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    category_id UUID,
    status ENUM('draft', 'published', 'completed', 'suspended') DEFAULT 'draft',
    content_type ENUM('free', 'paid', 'mixed') DEFAULT 'free',
    total_chapters INT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    total_likes BIGINT DEFAULT 0,
    total_comments BIGINT DEFAULT 0,
    total_coins_earned DECIMAL(10,2) DEFAULT 0.00,
    is_featured BOOLEAN DEFAULT FALSE,
    moderation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    moderation_notes TEXT,
    tags JSON, -- Store tags as JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_stories_author (author_id),
    INDEX idx_stories_category (category_id),
    INDEX idx_stories_status (status),
    INDEX idx_stories_content_type (content_type),
    INDEX idx_stories_featured (is_featured),
    INDEX idx_stories_moderation (moderation_status),
    INDEX idx_stories_published (published_at),
    FULLTEXT INDEX ft_stories_search (title, description)
);

-- Chapters Table
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL,
    chapter_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    word_count INT DEFAULT 0,
    coin_price DECIMAL(8,2) DEFAULT 0.00,
    is_free BOOLEAN DEFAULT TRUE,
    status ENUM('draft', 'published') DEFAULT 'draft',
    views BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    moderation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    moderation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_chapter (story_id, chapter_number),
    INDEX idx_chapters_story (story_id),
    INDEX idx_chapters_status (status),
    INDEX idx_chapters_free (is_free),
    INDEX idx_chapters_moderation (moderation_status),
    INDEX idx_chapters_published (published_at),
    FULLTEXT INDEX ft_chapters_search (title, content)
);

-- User Reading Progress
CREATE TABLE reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    story_id UUID NOT NULL,
    chapter_id UUID NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    UNIQUE KEY unique_progress (user_id, story_id),
    INDEX idx_progress_user (user_id),
    INDEX idx_progress_story (story_id)
);

-- User Reading Lists
CREATE TABLE reading_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    story_id UUID NOT NULL,
    list_type ENUM('reading', 'completed', 'favorite', 'want_to_read') NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_list_item (user_id, story_id, list_type),
    INDEX idx_reading_list_user (user_id),
    INDEX idx_reading_list_story (story_id),
    INDEX idx_reading_list_type (list_type)
);

-- Comments System
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    story_id UUID,
    chapter_id UUID,
    parent_comment_id UUID, -- For replies
    content TEXT NOT NULL,
    likes BIGINT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    moderation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
    moderation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_comments_user (user_id),
    INDEX idx_comments_story (story_id),
    INDEX idx_comments_chapter (chapter_id),
    INDEX idx_comments_parent (parent_comment_id),
    INDEX idx_comments_moderation (moderation_status),
    INDEX idx_comments_created (created_at)
);

-- Reactions/Likes System
CREATE TABLE reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    target_type ENUM('story', 'chapter', 'comment') NOT NULL,
    target_id UUID NOT NULL,
    reaction_type ENUM('like') DEFAULT 'like',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_reaction (user_id, target_type, target_id),
    INDEX idx_reactions_user (user_id),
    INDEX idx_reactions_target (target_type, target_id),
    INDEX idx_reactions_type (reaction_type)
);

-- Coin/Credit System
CREATE TABLE coin_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    coin_amount INT NOT NULL,
    price_thb DECIMAL(10,2) NOT NULL,
    bonus_coins INT DEFAULT 0,
    service_fee_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_packages_active (is_active)
);

-- Coin Transactions
CREATE TABLE coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    transaction_type ENUM('purchase', 'spend', 'earn', 'gift_received', 'gift_sent', 'withdrawal', 'airdrop') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    reference_type ENUM('chapter_purchase', 'gift', 'withdrawal', 'package_purchase', 'ad_reward', 'airdrop') NULL,
    reference_id UUID NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    payment_method ENUM('line_pay', 'promptpay', 'admin_transfer') NULL,
    payment_reference VARCHAR(255),
    notes TEXT,
    processed_by UUID, -- Admin who processed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_transactions_user (user_id),
    INDEX idx_transactions_type (transaction_type),
    INDEX idx_transactions_status (status),
    INDEX idx_transactions_reference (reference_type, reference_id),
    INDEX idx_transactions_created (created_at)
);

-- Gift System
CREATE TABLE gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT NOT NULL,
    coin_cost INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_gifts_active (is_active),
    INDEX idx_gifts_cost (coin_cost)
);

CREATE TABLE gift_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    story_id UUID,
    chapter_id UUID,
    quantity INT DEFAULT 1,
    total_coins DECIMAL(10,2) NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (gift_id) REFERENCES gifts(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    INDEX idx_gift_trans_sender (sender_id),
    INDEX idx_gift_trans_recipient (recipient_id),
    INDEX idx_gift_trans_story (story_id),
    INDEX idx_gift_trans_created (created_at)
);

-- Chapter Purchases (For tracking paid content access)
CREATE TABLE chapter_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    chapter_id UUID NOT NULL,
    story_id UUID NOT NULL,
    coins_spent DECIMAL(8,2) NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_purchase (user_id, chapter_id),
    INDEX idx_purchases_user (user_id),
    INDEX idx_purchases_chapter (chapter_id),
    INDEX idx_purchases_story (story_id)
);

-- Notifications System
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type ENUM('new_chapter', 'new_story', 'gift_received', 'comment', 'like', 'follow', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_type ENUM('story', 'chapter', 'user', 'gift', 'comment') NULL,
    related_id UUID NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_via_line BOOLEAN DEFAULT FALSE,
    line_message_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_unread (user_id, is_read),
    INDEX idx_notifications_created (created_at)
);

-- Content Moderation System
CREATE TABLE moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type ENUM('story', 'chapter', 'comment') NOT NULL,
    content_id UUID NOT NULL,
    moderator_id UUID, -- NULL for AI moderation
    action ENUM('approve', 'reject', 'flag', 'auto_reject') NOT NULL,
    reason TEXT,
    ai_confidence_score DECIMAL(5,4), -- For AI moderation
    flagged_content JSON, -- Store flagged portions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_moderation_content (content_type, content_id),
    INDEX idx_moderation_moderator (moderator_id),
    INDEX idx_moderation_action (action),
    INDEX idx_moderation_created (created_at)
);

-- User Reports
CREATE TABLE user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL,
    reported_user_id UUID,
    content_type ENUM('story', 'chapter', 'comment', 'user') NOT NULL,
    content_id UUID,
    reason ENUM('spam', 'harassment', 'inappropriate_content', 'copyright', 'hate_speech', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewing', 'resolved', 'dismissed') DEFAULT 'pending',
    resolved_by UUID,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_reports_reporter (reporter_id),
    INDEX idx_reports_reported (reported_user_id),
    INDEX idx_reports_content (content_type, content_id),
    INDEX idx_reports_status (status),
    INDEX idx_reports_created (created_at)
);

-- Analytics and Statistics
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    stories_read INT DEFAULT 0,
    chapters_read INT DEFAULT 0,
    time_spent_minutes INT DEFAULT 0,
    coins_spent DECIMAL(10,2) DEFAULT 0.00,
    coins_earned DECIMAL(10,2) DEFAULT 0.00,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date),
    INDEX idx_analytics_user (user_id),
    INDEX idx_analytics_date (date)
);

CREATE TABLE story_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL,
    date DATE NOT NULL,
    views INT DEFAULT 0,
    unique_readers INT DEFAULT 0,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    coins_earned DECIMAL(10,2) DEFAULT 0.00,
    
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_story_date (story_id, date),
    INDEX idx_story_analytics_story (story_id),
    INDEX idx_story_analytics_date (date)
);

-- Search and Recommendation System
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    preferred_categories JSON, -- Array of category IDs
    preferred_tags JSON, -- Array of tags
    reading_time_preference ENUM('short', 'medium', 'long') DEFAULT 'medium',
    content_preference ENUM('free', 'paid', 'both') DEFAULT 'both',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_pref (user_id)
);

CREATE TABLE recommendation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    story_id UUID NOT NULL,
    recommendation_score DECIMAL(5,4) NOT NULL,
    recommendation_reason JSON, -- Store reasoning data
    shown_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    clicked BOOLEAN DEFAULT FALSE,
    clicked_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    INDEX idx_recommendations_user (user_id),
    INDEX idx_recommendations_story (story_id),
    INDEX idx_recommendations_score (recommendation_score),
    INDEX idx_recommendations_shown (shown_at)
);

-- System Configuration
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_settings_key (setting_key)
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('coin_to_thb_rate', '1.00', 'Exchange rate from coins to THB'),
('min_withdrawal_coins', '100', 'Minimum coins required for withdrawal'),
('max_withdrawal_coins', '10000', 'Maximum coins allowed per withdrawal'),
('ad_reward_coins', '1', 'Coins earned per 30-second ad view'),
('default_service_fee', '10.00', 'Default service fee percentage'),
('max_chapter_word_count', '10000', 'Maximum words per chapter'),
('max_story_chapters', '1000', 'Maximum chapters per story'),
('password_reset_token_expiry_hours', '24', 'Password reset token validity in hours'),
('max_password_reset_attempts_per_hour', '5', 'Maximum password reset attempts per IP per hour'),
('email_verification_token_expiry_hours', '48', 'Email verification token validity in hours'),
('password_min_length', '8', 'Minimum password length requirement'),
('require_password_change_days', '90', 'Days after which password change is recommended');

-- Insert default gift items
INSERT INTO gifts (name, description, icon_url, coin_cost) VALUES
('Heart', 'Show your love', '/icons/heart.png', 1),
('Star', 'This story shines', '/icons/star.png', 5),
('Crown', 'You are the king/queen', '/icons/crown.png', 10),
('Diamond', 'Precious like a diamond', '/icons/diamond.png', 25),
('Trophy', 'You deserve this trophy', '/icons/trophy.png', 50);

-- Insert default coin packages
INSERT INTO coin_packages (name, coin_amount, price_thb, bonus_coins, service_fee_percentage) VALUES
('Starter Pack', 100, 100.00, 0, 5.00),
('Popular Pack', 500, 450.00, 50, 7.00),
('Premium Pack', 1000, 850.00, 150, 10.00),
('Mega Pack', 2500, 2000.00, 500, 12.00);

-- Create indexes for better performance
CREATE INDEX idx_stories_author_status ON stories(author_id, status);
CREATE INDEX idx_chapters_story_published ON chapters(story_id, published_at);
CREATE INDEX idx_transactions_user_type_created ON coin_transactions(user_id, transaction_type, created_at);
CREATE INDEX idx_notifications_user_unread_created ON notifications(user_id, is_read, created_at);

-- Views for common queries
CREATE VIEW popular_stories AS
SELECT 
    s.*,
    u.username as author_username,
    u.display_name as author_display_name,
    c.name as category_name,
    COALESCE(sa.total_views_30d, 0) as views_30d
FROM stories s
JOIN users u ON s.author_id = u.id
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN (
    SELECT 
        story_id,
        SUM(views) as total_views_30d
    FROM story_analytics 
    WHERE date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
    GROUP BY story_id
) sa ON s.id = sa.story_id
WHERE s.status = 'published'
ORDER BY views_30d DESC, s.total_views DESC;

CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.role,
    u.coin_balance,
    COUNT(DISTINCT s.id) as published_stories,
    COUNT(DISTINCT c.id) as total_chapters,
    COALESCE(SUM(s.total_views), 0) as total_story_views,
    COALESCE(SUM(s.total_likes), 0) as total_story_likes,
    u.total_earned_coins,
    (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as followers_count,
    (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.id) as following_count,
    -- Reader stats
    (SELECT COUNT(*) FROM reading_lists rl WHERE rl.user_id = u.id AND rl.list_type = 'completed') as books_completed,
    (SELECT COUNT(DISTINCT cp.story_id) FROM chapter_purchases cp WHERE cp.user_id = u.id) as books_purchased,
    (SELECT SUM(ct.amount) FROM coin_transactions ct WHERE ct.user_id = u.id AND ct.transaction_type = 'spend') as total_coins_spent
FROM users u
LEFT JOIN stories s ON u.id = s.author_id AND s.status = 'published'
LEFT JOIN chapters c ON s.id = c.story_id AND c.status = 'published'
WHERE u.status = 'active'
GROUP BY u.id;
