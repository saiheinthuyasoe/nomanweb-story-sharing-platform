-- Manual Migration: Add chapters_at_purchase column to book_purchases table
-- Run this script directly in your database

-- Add the new column
ALTER TABLE book_purchases 
ADD COLUMN chapters_at_purchase INTEGER;

-- Update existing records with the current chapter count for their stories
-- This counts chapters that were published at or before the book purchase date
UPDATE book_purchases bp 
SET chapters_at_purchase = (
    SELECT COALESCE(COUNT(*), 0) 
    FROM chapters c 
    WHERE c.story_id = bp.story_id 
    AND c.status = 'PUBLISHED'
    AND c.created_at <= bp.purchased_at
    AND (c.is_deleted = false OR c.is_deleted IS NULL)
);

-- Make the column NOT NULL after populating existing data
ALTER TABLE book_purchases 
ALTER COLUMN chapters_at_purchase SET NOT NULL;

-- Add an index for better performance
CREATE INDEX idx_book_purchases_chapters_at_purchase ON book_purchases(chapters_at_purchase);

-- Verify the migration
SELECT 
    bp.id,
    bp.story_id,
    bp.chapters_at_purchase,
    s.title as story_title,
    s.pricing_type
FROM book_purchases bp
JOIN stories s ON bp.story_id = s.id
LIMIT 10; 