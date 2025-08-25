-- Fix duplicate chapter purchases
-- This script removes duplicate records and updates the unique constraint

BEGIN;

-- First, let's see what duplicates we have
SELECT 'Duplicate records found:' as info;
SELECT user_id, chapter_id, COUNT(*) as count 
FROM chapter_purchases 
GROUP BY user_id, chapter_id 
HAVING COUNT(*) > 1;

-- Remove duplicate records, keeping only the most recent one for each user-chapter combination
-- This handles cases where there might be multiple purchases/refunds
WITH ranked_purchases AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY user_id, chapter_id 
               ORDER BY purchased_at DESC, 
                        CASE WHEN is_refunded = false THEN 0 ELSE 1 END,
                        id DESC
           ) as rn
    FROM chapter_purchases
)
DELETE FROM chapter_purchases 
WHERE id IN (
    SELECT id FROM ranked_purchases WHERE rn > 1
);

-- Show how many records were affected
SELECT 'Cleanup completed. Checking for remaining duplicates:' as info;
SELECT user_id, chapter_id, COUNT(*) as count 
FROM chapter_purchases 
GROUP BY user_id, chapter_id 
HAVING COUNT(*) > 1;

-- Drop the old unique constraint
ALTER TABLE chapter_purchases DROP CONSTRAINT IF EXISTS unique_purchase;

-- Create a new unique constraint that allows multiple records only if previous ones are refunded
-- This allows repurchasing after refund
CREATE UNIQUE INDEX unique_active_purchase 
ON chapter_purchases (user_id, chapter_id) 
WHERE is_refunded = false OR is_refunded IS NULL;

SELECT 'New unique constraint created successfully' as info;

COMMIT;