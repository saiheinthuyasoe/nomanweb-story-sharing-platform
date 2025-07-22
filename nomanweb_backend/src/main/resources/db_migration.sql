-- Migration script to add missing reader functionality tables
-- Run this script on your PostgreSQL database

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('STORY', 'CHAPTER', 'COMMENT')),
    target_id UUID NOT NULL,
    reaction_type VARCHAR(20) DEFAULT 'LIKE' CHECK (reaction_type IN ('LIKE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_reactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_reaction UNIQUE (user_id, target_type, target_id)
);

-- Create indexes for reactions table
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON reactions(reaction_type);

-- Create reading_lists table
CREATE TABLE IF NOT EXISTS reading_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    story_id UUID NOT NULL,
    list_type VARCHAR(20) NOT NULL CHECK (list_type IN ('READING', 'COMPLETED', 'LIKE', 'WANT_TO_READ')),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_reading_lists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reading_lists_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    CONSTRAINT unique_list_item UNIQUE (user_id, story_id, list_type)
);

-- Create indexes for reading_lists table
CREATE INDEX IF NOT EXISTS idx_reading_list_user ON reading_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_story ON reading_lists(story_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_type ON reading_lists(list_type);

-- Drop the old reading_progress table if it exists with wrong constraint
DROP TABLE IF EXISTS reading_progress;

-- Create reading_progress table with correct constraints
CREATE TABLE reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    story_id UUID NOT NULL,
    chapter_id UUID NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_reading_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reading_progress_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    CONSTRAINT fk_reading_progress_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    -- Fixed: Allow multiple progress records per story, but unique per chapter
    CONSTRAINT unique_chapter_progress UNIQUE (user_id, story_id, chapter_id)
);

-- Create indexes for reading_progress table
CREATE INDEX IF NOT EXISTS idx_progress_user ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_story ON reading_progress(story_id);
CREATE INDEX IF NOT EXISTS idx_progress_chapter ON reading_progress(chapter_id);
CREATE INDEX IF NOT EXISTS idx_progress_last_read ON reading_progress(user_id, last_read_at);

-- Create monetization tables

-- Gift System
CREATE TABLE IF NOT EXISTS gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT NOT NULL,
    coin_cost DECIMAL(8,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gifts_active ON gifts(is_active);
CREATE INDEX IF NOT EXISTS idx_gifts_cost ON gifts(coin_cost);

CREATE TABLE IF NOT EXISTS gift_transactions (
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
    
    CONSTRAINT fk_gift_trans_gift FOREIGN KEY (gift_id) REFERENCES gifts(id) ON DELETE CASCADE,
    CONSTRAINT fk_gift_trans_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_gift_trans_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_gift_trans_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    CONSTRAINT fk_gift_trans_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gift_trans_sender ON gift_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_gift_trans_recipient ON gift_transactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gift_trans_story ON gift_transactions(story_id);
CREATE INDEX IF NOT EXISTS idx_gift_trans_created ON gift_transactions(created_at);

-- Chapter Purchases (For tracking paid content access)
CREATE TABLE IF NOT EXISTS chapter_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    chapter_id UUID NOT NULL,
    story_id UUID NOT NULL,
    coins_spent DECIMAL(8,2) NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_chapter_purchases_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_chapter_purchases_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    CONSTRAINT fk_chapter_purchases_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    CONSTRAINT unique_purchase UNIQUE (user_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON chapter_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_chapter ON chapter_purchases(chapter_id);
CREATE INDEX IF NOT EXISTS idx_purchases_story ON chapter_purchases(story_id);

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_system_settings_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(setting_key);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('platform_fee_percentage', '30.00', 'Platform fee percentage for transactions'),
('gift_recipient_percentage', '100.00', 'Percentage of gift value that recipients receive (no platform fee)'),
('author_earnings_percentage', '70.00', 'Percentage of chapter sales that authors receive'),
('min_withdrawal_coins', '100', 'Minimum coins required for withdrawal'),
('max_withdrawal_coins', '10000', 'Maximum coins allowed per withdrawal'),
('coin_to_thb_rate', '1.00', 'Exchange rate from coins to THB')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default gift items
INSERT INTO gifts (name, description, icon_url, coin_cost) VALUES
('Heart', 'Show your love', '/icons/heart.png', 1),
('Star', 'This story shines', '/icons/star.png', 5),
('Crown', 'You are the king/queen', '/icons/crown.png', 10),
('Diamond', 'Precious like a diamond', '/icons/diamond.png', 25),
('Trophy', 'You deserve this trophy', '/icons/trophy.png', 50)
ON CONFLICT (name) DO NOTHING;

-- Display completion message
SELECT 'Reader functionality and monetization tables created successfully!' as status; 