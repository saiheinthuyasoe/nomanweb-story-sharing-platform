-- Make gift_id nullable to support custom/emoji gifts
ALTER TABLE gift_transactions ALTER COLUMN gift_id DROP NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN gift_transactions.gift_id IS 'Can be NULL for custom coin amounts or emoji gifts'; 