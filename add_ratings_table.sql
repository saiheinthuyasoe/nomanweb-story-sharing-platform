-- 1. Create story_ratings table
CREATE TABLE story_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    story_id UUID NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_story FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_story_rating UNIQUE (user_id, story_id)
);

-- 2. Create indexes for better performance
CREATE INDEX idx_ratings_user ON story_ratings(user_id);
CREATE INDEX idx_ratings_story ON story_ratings(story_id);
CREATE INDEX idx_ratings_value ON story_ratings(rating);
CREATE INDEX idx_ratings_created ON story_ratings(created_at);

-- 3. Alter stories table to add rating fields
ALTER TABLE stories 
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN total_ratings INT DEFAULT 0;

CREATE INDEX idx_stories_rating ON stories(average_rating);

-- 4. Function to update story stats after INSERT or UPDATE
CREATE OR REPLACE FUNCTION update_story_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE stories
    SET
        total_ratings = (SELECT COUNT(*) FROM story_ratings WHERE story_id = NEW.story_id),
        average_rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM story_ratings WHERE story_id = NEW.story_id)
    WHERE id = NEW.story_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to update story stats after DELETE
CREATE OR REPLACE FUNCTION update_story_rating_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE stories
    SET
        total_ratings = (SELECT COUNT(*) FROM story_ratings WHERE story_id = OLD.story_id),
        average_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM story_ratings WHERE story_id = OLD.story_id), 0.00)
    WHERE id = OLD.story_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 6. Create triggers for insert, update, delete
CREATE TRIGGER trg_story_rating_insert
AFTER INSERT ON story_ratings
FOR EACH ROW
EXECUTE FUNCTION update_story_rating_stats();

CREATE TRIGGER trg_story_rating_update
AFTER UPDATE ON story_ratings
FOR EACH ROW
EXECUTE FUNCTION update_story_rating_stats();

CREATE TRIGGER trg_story_rating_delete
AFTER DELETE ON story_ratings
FOR EACH ROW
EXECUTE FUNCTION update_story_rating_stats_on_delete();

-- 7. Optional: Insert sample test ratings (adjust UUIDs)
-- INSERT INTO story_ratings (user_id, story_id, rating) VALUES
-- ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5),
-- ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4),
-- ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3);
