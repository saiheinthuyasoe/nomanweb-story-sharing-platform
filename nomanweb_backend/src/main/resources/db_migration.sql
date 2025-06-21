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
    list_type VARCHAR(20) NOT NULL CHECK (list_type IN ('READING', 'COMPLETED', 'FAVORITE', 'WANT_TO_READ')),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_reading_lists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reading_lists_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    CONSTRAINT unique_list_item UNIQUE (user_id, story_id, list_type)
);

-- Create indexes for reading_lists table
CREATE INDEX IF NOT EXISTS idx_reading_list_user ON reading_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_story ON reading_lists(story_id);
CREATE INDEX IF NOT EXISTS idx_reading_list_type ON reading_lists(list_type);

-- Create reading_progress table
CREATE TABLE IF NOT EXISTS reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    story_id UUID NOT NULL,
    chapter_id UUID NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_reading_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reading_progress_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    CONSTRAINT fk_reading_progress_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    CONSTRAINT unique_progress UNIQUE (user_id, story_id)
);

-- Create indexes for reading_progress table
CREATE INDEX IF NOT EXISTS idx_progress_user ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_story ON reading_progress(story_id);
CREATE INDEX IF NOT EXISTS idx_progress_chapter ON reading_progress(chapter_id);

-- Display completion message
SELECT 'Reader functionality tables created successfully!' as status; 