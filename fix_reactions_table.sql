-- Fix missing reactions table
-- Run this script to create the reactions table that is missing from the database

-- Drop the table if it exists (in case there's a partial/corrupted table)
DROP TABLE IF EXISTS reactions CASCADE;

-- Create reactions table
CREATE TABLE reactions (
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
CREATE INDEX idx_reactions_user ON reactions(user_id);
CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);
CREATE INDEX idx_reactions_type ON reactions(reaction_type);

-- Verify the table was created
SELECT 'Reactions table created successfully!' as status;
SELECT COUNT(*) as reaction_count FROM reactions; 