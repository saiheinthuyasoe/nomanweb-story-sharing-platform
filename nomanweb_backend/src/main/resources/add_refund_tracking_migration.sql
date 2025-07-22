-- Migration to add refund tracking columns to purchase tables
-- Run this migration to add refund tracking functionality

-- Add refund tracking columns to book_purchases table
ALTER TABLE book_purchases 
ADD COLUMN is_refunded BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN refunded_at TIMESTAMP NULL;

-- Add refund tracking columns to chapter_purchases table
ALTER TABLE chapter_purchases 
ADD COLUMN is_refunded BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN refunded_at TIMESTAMP NULL;

-- Create indexes for better query performance
CREATE INDEX idx_book_purchases_is_refunded ON book_purchases(is_refunded);
CREATE INDEX idx_chapter_purchases_is_refunded ON chapter_purchases(is_refunded);

-- Optional: Update existing data to ensure consistency
-- (This would mark any purchases that have completed refund transactions as refunded)
/*
UPDATE book_purchases bp 
SET is_refunded = TRUE, refunded_at = rt.processed_at
FROM refund_transactions rt 
WHERE rt.buyer_id = bp.user_id 
  AND rt.story_id = bp.story_id 
  AND rt.chapter_id IS NULL 
  AND rt.refund_status = 'COMPLETED'
  AND bp.is_refunded = FALSE;

UPDATE chapter_purchases cp 
SET is_refunded = TRUE, refunded_at = rt.processed_at
FROM refund_transactions rt 
WHERE rt.buyer_id = cp.user_id 
  AND rt.story_id = cp.story_id 
  AND rt.chapter_id = cp.chapter_id 
  AND rt.refund_status = 'COMPLETED'
  AND cp.is_refunded = FALSE;
*/ 