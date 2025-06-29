-- Create collaborations table for real-time chapter editing
CREATE TABLE IF NOT EXISTS collaborations (
    id UUID PRIMARY KEY,
    chapter_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    invitation_token VARCHAR(255),
    invitation_expires_at TIMESTAMP,
    invitation_accepted_at TIMESTAMP,
    invited_by_user_id UUID,
    CONSTRAINT fk_collaboration_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    CONSTRAINT fk_collaboration_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_collaboration_invited_by FOREIGN KEY (invited_by_user_id) REFERENCES users(id),
    CONSTRAINT uk_collaborations_chapter_user UNIQUE (chapter_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_collaborations_chapter_id ON collaborations(chapter_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_user_id ON collaborations(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_invitation_token ON collaborations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_collaborations_active ON collaborations(active);

-- Add comment
COMMENT ON TABLE collaborations IS 'Stores chapter collaboration relationships, including roles and active status';