-- Migration script to add trash functionality to chapters table
-- This adds soft delete functionality to allow chapters to be moved to trash

-- Add deleted_at and is_deleted columns to chapters table
ALTER TABLE chapters 
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Add index for better performance on trash queries
CREATE INDEX idx_chapters_is_deleted ON chapters(is_deleted);
CREATE INDEX idx_chapters_deleted_at ON chapters(deleted_at);

-- Update existing chapters to have is_deleted = false (for safety)
UPDATE chapters SET is_deleted = FALSE WHERE is_deleted IS NULL;

-- Make is_deleted non-nullable after setting default values
ALTER TABLE chapters ALTER COLUMN is_deleted SET NOT NULL; 