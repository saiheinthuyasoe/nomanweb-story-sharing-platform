-- Migration: Add notification preferences to users table
-- Date: 2024-01-XX
-- Description: Add email and LINE notification preference columns to support multi-channel notifications

-- Add notification preference columns to users table
ALTER TABLE users 
ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN line_notifications_enabled BOOLEAN DEFAULT FALSE;

-- Add indexes for better performance on notification queries
CREATE INDEX IF NOT EXISTS idx_users_email_notifications ON users(email_notifications_enabled);
CREATE INDEX IF NOT EXISTS idx_users_line_notifications ON users(line_notifications_enabled);

-- Update existing users to have email notifications enabled by default
UPDATE users SET email_notifications_enabled = TRUE WHERE email_notifications_enabled IS NULL;
UPDATE users SET line_notifications_enabled = FALSE WHERE line_notifications_enabled IS NULL;

-- Make columns non-nullable after setting default values
ALTER TABLE users ALTER COLUMN email_notifications_enabled SET NOT NULL;
ALTER TABLE users ALTER COLUMN line_notifications_enabled SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.email_notifications_enabled IS 'Whether user wants to receive email notifications';
COMMENT ON COLUMN users.line_notifications_enabled IS 'Whether user wants to receive LINE notifications';

-- Display completion message
SELECT 'Notification preferences migration completed successfully!' as status;
SELECT 'Added email_notifications_enabled and line_notifications_enabled columns to users table' as details;