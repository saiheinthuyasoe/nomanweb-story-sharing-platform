-- Admin Invitations Table Migration
-- Run this after your application starts to create the admin_invitations table

CREATE TABLE IF NOT EXISTS admin_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'PENDING',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    registered_admin UUID REFERENCES users(id),
    notes TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_invitations_token ON admin_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_email ON admin_invitations(email);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_status ON admin_invitations(status);

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

COMMIT; 