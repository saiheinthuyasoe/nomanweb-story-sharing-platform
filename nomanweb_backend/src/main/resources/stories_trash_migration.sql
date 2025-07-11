-- Migration script to add trash functionality to stories table
-- This adds soft delete functionality to allow stories to be moved to trash

-- Add deleted_at and is_deleted columns to stories table
ALTER TABLE stories 
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Add index for better performance on trash queries
CREATE INDEX idx_stories_is_deleted ON stories(is_deleted);
CREATE INDEX idx_stories_deleted_at ON stories(deleted_at);

-- Update existing stories to have is_deleted = false (for safety)
UPDATE stories SET is_deleted = FALSE WHERE is_deleted IS NULL;

-- Make is_deleted non-nullable after setting default values
ALTER TABLE stories ALTER COLUMN is_deleted SET NOT NULL; 