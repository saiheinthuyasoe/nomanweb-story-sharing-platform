-- Add content_status column to stories table
ALTER TABLE stories ADD COLUMN content_status VARCHAR(20) DEFAULT 'ONGOING' NOT NULL;

-- Update existing stories to have a default content status
UPDATE stories SET content_status = 'ONGOING' WHERE content_status IS NULL;

-- Add check constraint for content_status values
ALTER TABLE stories ADD CONSTRAINT check_content_status 
    CHECK (content_status IN ('ONGOING', 'COMPLETED')); 