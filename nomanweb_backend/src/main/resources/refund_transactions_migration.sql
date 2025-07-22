-- Migration for refund_transactions table
CREATE TABLE refund_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL,
    buyer_id UUID NOT NULL,
    story_id UUID,
    chapter_id UUID,
    refund_amount DECIMAL(10, 2) NOT NULL,
    original_purchase_amount DECIMAL(10, 2) NOT NULL,
    refund_type VARCHAR(50) NOT NULL,
    refund_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    admin_notes TEXT,
    processed_by_admin_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_refund_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_refund_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_refund_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    CONSTRAINT fk_refund_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    CONSTRAINT fk_refund_admin FOREIGN KEY (processed_by_admin_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_refund_amount_positive CHECK (refund_amount > 0),
    CONSTRAINT chk_original_amount_positive CHECK (original_purchase_amount > 0),
    CONSTRAINT chk_refund_type CHECK (refund_type IN ('STORY_DELETION', 'CHAPTER_DELETION', 'STORY_UNPUBLISH', 'CHAPTER_UNPUBLISH', 'PRICING_CHANGE_TO_FREE', 'PRICING_CHANGE', 'MANUAL_REFUND')),
    CONSTRAINT chk_refund_status CHECK (refund_status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'FAILED')),
    CONSTRAINT chk_refund_reference CHECK (
        (story_id IS NOT NULL AND chapter_id IS NULL) OR 
        (story_id IS NOT NULL AND chapter_id IS NOT NULL) OR 
        (story_id IS NULL AND chapter_id IS NOT NULL)
    )
);

-- Create indexes for better performance
CREATE INDEX idx_refund_author ON refund_transactions(author_id);
CREATE INDEX idx_refund_buyer ON refund_transactions(buyer_id);
CREATE INDEX idx_refund_status ON refund_transactions(refund_status);
CREATE INDEX idx_refund_story ON refund_transactions(story_id);
CREATE INDEX idx_refund_chapter ON refund_transactions(chapter_id);
CREATE INDEX idx_refund_created_at ON refund_transactions(created_at);
CREATE INDEX idx_refund_processed_at ON refund_transactions(processed_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_refund_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_refund_updated_at
    BEFORE UPDATE ON refund_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_refund_updated_at(); 