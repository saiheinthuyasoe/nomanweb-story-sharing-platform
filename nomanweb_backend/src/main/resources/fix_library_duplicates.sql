-- Fix library duplicates migration
-- This script removes duplicate entries and ensures unique constraint is enforced

-- Step 1: Identify and remove duplicates, keeping the earliest entry for each combination
WITH duplicate_libraries AS (
    SELECT 
        user_id,
        story_id,
        list_type,
        MIN(added_at) as earliest_added_at
    FROM libraries
    GROUP BY user_id, story_id, list_type
    HAVING COUNT(*) > 1
),
libraries_to_keep AS (
    SELECT l.id
    FROM libraries l
    INNER JOIN duplicate_libraries dl ON 
        l.user_id = dl.user_id 
        AND l.story_id = dl.story_id 
        AND l.list_type = dl.list_type 
        AND l.added_at = dl.earliest_added_at
),
libraries_to_delete AS (
    SELECT l.id
    FROM libraries l
    INNER JOIN duplicate_libraries dl ON 
        l.user_id = dl.user_id 
        AND l.story_id = dl.story_id 
        AND l.list_type = dl.list_type
    WHERE l.id NOT IN (SELECT id FROM libraries_to_keep)
)
DELETE FROM libraries 
WHERE id IN (SELECT id FROM libraries_to_delete);

-- Step 2: Ensure the unique constraint exists (in case it wasn't created properly)
ALTER TABLE libraries 
DROP CONSTRAINT IF EXISTS unique_library_item;

ALTER TABLE libraries 
ADD CONSTRAINT unique_library_item UNIQUE (user_id, story_id, list_type);

-- Step 3: Verify no duplicates remain
SELECT 
    user_id,
    story_id,
    list_type,
    COUNT(*) as count
FROM libraries
GROUP BY user_id, story_id, list_type
HAVING COUNT(*) > 1;

-- If the above query returns any rows, there are still duplicates that need manual review