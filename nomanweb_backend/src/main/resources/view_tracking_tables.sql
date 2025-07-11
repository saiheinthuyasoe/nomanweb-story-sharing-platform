-- Chapter Views Table
CREATE TABLE IF NOT EXISTS chapter_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    chapter_id UUID NOT NULL,
    view_count INTEGER NOT NULL DEFAULT 1,
    first_viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    UNIQUE (user_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_chapter_views_user ON chapter_views(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_views_chapter ON chapter_views(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_views_last_viewed ON chapter_views(last_viewed_at);


-- Story Views Table
CREATE TABLE IF NOT EXISTS story_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    story_id UUID NOT NULL,
    view_count INTEGER NOT NULL DEFAULT 1,
    first_viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    UNIQUE (user_id, story_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_user ON story_views(user_id);
CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_last_viewed ON story_views(last_viewed_at);


COMMENT ON TABLE chapter_views IS 'Tracks individual user views of chapters to prevent duplicate counting';
COMMENT ON TABLE story_views IS 'Tracks individual user views of stories to prevent duplicate counting';
COMMENT ON COLUMN chapter_views.view_count IS 'Number of times this user has viewed this chapter (with cooldown periods)';
COMMENT ON COLUMN story_views.view_count IS 'Number of times this user has viewed this story (with cooldown periods)';
COMMENT ON COLUMN chapter_views.last_viewed_at IS 'Last time this user viewed this chapter (used for cooldown calculation)';
COMMENT ON COLUMN story_views.last_viewed_at IS 'Last time this user viewed this story (used for cooldown calculation)';
