-- Check constraints on libraries table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.table_name
FROM 
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
WHERE 
    tc.table_name = 'libraries'
    AND tc.constraint_type = 'UNIQUE'
ORDER BY 
    tc.constraint_name, kcu.ordinal_position;

-- Also check if there are any duplicate entries in the libraries table
SELECT 
    user_id,
    story_id,
    list_type,
    COUNT(*) as duplicate_count
FROM libraries
GROUP BY user_id, story_id, list_type
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;