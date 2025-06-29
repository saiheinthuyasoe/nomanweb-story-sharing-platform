-- Coin Packages Migration
-- Create coin_packages table if it doesn't exist

CREATE TABLE IF NOT EXISTS coin_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    coin_amount INT NOT NULL,
    price_thb DECIMAL(10,2) NOT NULL,
    bonus_coins INT DEFAULT 0,
    service_fee_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_packages_active (is_active)
);

-- Insert some default coin packages if table is empty
INSERT INTO coin_packages (name, coin_amount, price_thb, bonus_coins, is_active)
SELECT * FROM (
    SELECT 'Starter Pack' as name, 100 as coin_amount, 349.99 as price_thb, 10 as bonus_coins, true as is_active
    UNION ALL
    SELECT 'Premium Pack', 500, 1399.99, 75, true
    UNION ALL
    SELECT 'Ultimate Pack', 1000, 2449.99, 200, true
    UNION ALL
    SELECT 'Mega Pack', 2500, 5599.99, 600, true
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM coin_packages LIMIT 1);

-- Add some indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coin_packages_name ON coin_packages(name);
CREATE INDEX IF NOT EXISTS idx_coin_packages_coin_amount ON coin_packages(coin_amount);
CREATE INDEX IF NOT EXISTS idx_coin_packages_price ON coin_packages(price_thb); 