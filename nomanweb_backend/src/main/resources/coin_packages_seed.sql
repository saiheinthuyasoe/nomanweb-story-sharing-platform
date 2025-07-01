-- Seed data for coin packages
-- Run this script to populate the database with default coin packages

INSERT INTO coin_packages (id, name, coin_amount, price_thb, bonus_coins, service_fee_percentage, is_active, description, created_at) 
VALUES 
    (gen_random_uuid(), 'Starter Pack', 100, 1015.00, 0, 0.00, true, 'Perfect for trying out premium content', NOW()),
    (gen_random_uuid(), 'Popular Pack', 500, 4865.00, 50, 0.00, true, 'Best value for regular readers - includes bonus coins!', NOW()),
    (gen_random_uuid(), 'Premium Pack', 1000, 9415.00, 150, 0.00, true, 'For dedicated story enthusiasts with extra bonus', NOW()),
    (gen_random_uuid(), 'Ultimate Pack', 2500, 22715.00, 500, 0.00, true, 'Maximum value for serious collectors - huge bonus included!', NOW())
ON CONFLICT (name) DO NOTHING; 