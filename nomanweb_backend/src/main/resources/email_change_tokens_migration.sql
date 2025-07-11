-- Email Change Tokens Table Migration
-- This table stores tokens for email change verification

CREATE TABLE IF NOT EXISTS email_change_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    new_email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    
    CONSTRAINT fk_email_change_tokens_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_email_change_tokens_token 
        UNIQUE (token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_user_id ON email_change_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_token ON email_change_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_expires_at ON email_change_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_used ON email_change_tokens(used);

-- Add comment to table
COMMENT ON TABLE email_change_tokens IS 'Stores verification tokens for email change requests';
COMMENT ON COLUMN email_change_tokens.user_id IS 'Reference to the user requesting email change';
COMMENT ON COLUMN email_change_tokens.token IS 'Unique verification token';
COMMENT ON COLUMN email_change_tokens.new_email IS 'The new email address to be verified';
COMMENT ON COLUMN email_change_tokens.expires_at IS 'Token expiration timestamp';
COMMENT ON COLUMN email_change_tokens.used IS 'Whether the token has been used';
COMMENT ON COLUMN email_change_tokens.created_at IS 'Token creation timestamp';
COMMENT ON COLUMN email_change_tokens.used_at IS 'Timestamp when token was used'; 