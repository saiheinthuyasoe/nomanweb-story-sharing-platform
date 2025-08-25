-- Add missing refund columns to chapter_purchases table
ALTER TABLE chapter_purchases 
ADD COLUMN IF NOT EXISTS is_refunded BOOLEAN DEFAULT FALSE;

ALTER TABLE chapter_purchases 
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;

-- Update existing records to have is_refunded = false if null
UPDATE chapter_purchases 
SET is_refunded = FALSE 
WHERE is_refunded IS NULL;