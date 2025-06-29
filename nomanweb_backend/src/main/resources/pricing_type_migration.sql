-- Migration to remove old content_type column (PostgreSQL)
-- This assumes pricing_type column already exists in the database

-- Step 1: Drop the index on the old content_type column
DROP INDEX IF EXISTS idx_stories_content_type;

-- Step 2: Remove the old content_type column from stories table
ALTER TABLE stories DROP COLUMN IF EXISTS content_type;

-- Step 3: Ensure index exists on pricing_type column (create if not exists)
CREATE INDEX IF NOT EXISTS idx_stories_pricing_type ON stories(pricing_type);

-- Note: Other content_type columns in moderation_logs and reports tables 
-- are different and should remain as content_type as they refer to content types (story, chapter, comment)
-- not pricing types

-- Note: This migration assumes that:
-- 1. pricing_type column already exists with proper constraints
-- 2. All data has been migrated from content_type to pricing_type
-- 3. Application code has been updated to use pricing_type 