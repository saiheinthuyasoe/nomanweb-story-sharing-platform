-- Add cover_image_url column to users table
ALTER TABLE users ADD COLUMN cover_image_url VARCHAR(500);

-- Add comment to document the new column
COMMENT ON COLUMN users.cover_image_url IS 'URL to the user''s profile cover image'; 