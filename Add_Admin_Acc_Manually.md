-- Insert a test super admin user (change email/password as needed)
INSERT INTO users (
    id, email, username, password_hash, role, email_verified, 
    coin_balance, total_earned_coins, created_at, updated_at
) VALUES (
    gen_random_uuid(), 
    'superadmin@nomanweb.com', 
    'superadmin', 
    '$2a$10$GJ2n.EfFPRAnsHdglYwJd.jFq5NjMnKYc/iCn8YIs/ge/xCbbQTJe', -- password: admin123 with bcrypt
    'ADMIN', 
    true, 
    0.00, 
    0.00, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;


Full Coin Flow
User buys 1,000 coins for $10 via Stripe.

Reader unlocks a chapter for 10 coins.

Platform takes a 30% commission → 3 coins.

Author earns 7 coins.

Author later requests withdrawal.

Platform converts 7 coins → real money (e.g., $0.07).

Platform pays via PayPal, bank transfer, or Stripe Connect.

