-- Book Purchases Table Migration
-- Create table for storing whole book purchases

CREATE TABLE book_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    story_id UUID NOT NULL,
    coins_spent DECIMAL(8,2) NOT NULL,
    purchased_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    
    -- Prevent duplicate purchases
    UNIQUE(user_id, story_id)
);

-- Create indexes for better performance
CREATE INDEX idx_book_purchases_user_id ON book_purchases(user_id);
CREATE INDEX idx_book_purchases_story_id ON book_purchases(story_id);
CREATE INDEX idx_book_purchases_purchased_at ON book_purchases(purchased_at);

-- Comments
COMMENT ON TABLE book_purchases IS 'Stores whole book purchase transactions';
COMMENT ON COLUMN book_purchases.coins_spent IS 'Amount of coins spent on the purchase';
COMMENT ON COLUMN book_purchases.purchased_at IS 'When the purchase was made'; 