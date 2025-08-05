-- Add libraries count columns to stories table
ALTER TABLE stories 
ADD COLUMN total_want_to_read BIGINT DEFAULT 0,
ADD COLUMN total_completed BIGINT DEFAULT 0,
ADD COLUMN total_currently_reading BIGINT DEFAULT 0;

-- Update existing stories with current counts from libraries table
UPDATE stories 
SET total_want_to_read = (
    SELECT COUNT(*) 
    FROM libraries 
    WHERE libraries.story_id = stories.id 
    AND libraries.list_type = 'WANT_TO_READ'
);

UPDATE stories 
SET total_completed = (
    SELECT COUNT(*) 
    FROM libraries 
    WHERE libraries.story_id = stories.id 
    AND libraries.list_type = 'COMPLETED'
);

UPDATE stories 
SET total_currently_reading = (
    SELECT COUNT(*) 
    FROM libraries 
    WHERE libraries.story_id = stories.id 
    AND libraries.list_type = 'READING'
);

-- Add NOT NULL constraints after populating data
ALTER TABLE stories 
ALTER COLUMN total_want_to_read SET NOT NULL,
ALTER COLUMN total_completed SET NOT NULL,
ALTER COLUMN total_currently_reading SET NOT NULL;