-- Migration to rename stories table columns
-- Rename status to publish_status and content_status to book_status
-- Date: [Current Date]

-- Step 1: Rename the status column to publish_status
ALTER TABLE stories RENAME COLUMN status TO publish_status;

-- Step 2: Rename the content_status column to book_status  
ALTER TABLE stories RENAME COLUMN content_status TO book_status;

-- Step 3: Update any indexes that might reference the old column names
-- Note: PostgreSQL automatically updates indexes when columns are renamed

-- Display completion message
SELECT 'Stories table columns renamed successfully!' as status;
SELECT 'status -> publish_status' as change1;
SELECT 'content_status -> book_status' as change2; 