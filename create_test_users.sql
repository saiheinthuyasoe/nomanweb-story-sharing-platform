-- Create test users for authentication testing

-- Insert a test admin user
INSERT INTO users (
    id, email, username, password_hash, role, email_verified, 
    coin_balance, total_earned_coins, created_at, updated_at, status
) VALUES (
    gen_random_uuid(), 
    'admin@test.com', 
    'testadmin', 
    '$2a$10$GJ2n.EfFPRAnsHdglYwJd.jFq5NjMnKYc/iCn8YIs/ge/xCbbQTJe', -- password: admin123
    'ADMIN', 
    true, 
    1000.00, 
    0.00, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP,
    'ACTIVE'
) ON CONFLICT (email) DO NOTHING;

-- Insert a test regular user
INSERT INTO users (
    id, email, username, password_hash, role, email_verified, 
    coin_balance, total_earned_coins, created_at, updated_at, status
) VALUES (
    gen_random_uuid(), 
    'user@test.com', 
    'testuser', 
    '$2a$10$GJ2n.EfFPRAnsHdglYwJd.jFq5NjMnKYc/iCn8YIs/ge/xCbbQTJe', -- password: admin123
    'USER', 
    true, 
    500.00, 
    0.00, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP,
    'ACTIVE'
) ON CONFLICT (email) DO NOTHING;

-- Insert another test user for gift testing
INSERT INTO users (
    id, email, username, password_hash, role, email_verified, 
    coin_balance, total_earned_coins, created_at, updated_at, status
) VALUES (
    gen_random_uuid(), 
    'user2@test.com', 
    'testuser2', 
    '$2a$10$GJ2n.EfFPRAnsHdglYwJd.jFq5NjMnKYc/iCn8YIs/ge/xCbbQTJe', -- password: admin123
    'USER', 
    true, 
    300.00, 
    0.00, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP,
    'ACTIVE'
) ON CONFLICT (email) DO NOTHING;

-- Verify the users were created
SELECT id, email, username, role, email_verified, coin_balance, status FROM users WHERE email IN ('admin@test.com', 'user@test.com', 'user2@test.com');