INSERT INTO users (
    id, email, username, password_hash, role, email_verified, 
    coin_balance, total_earned_coins, created_at, updated_at
) VALUES (
    gen_random_uuid(), 
    'superadmin@nomanweb.com', 
    'superadmin', 
    '$2a$10$GJ2n.EfFPRAnsHdglYwJd.jFq5NjMnKYc/iCn8YIs/ge/xCbbQTJe', 
    'ADMIN', 
    true, 
    0.00, 
    0.00, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;