-- Test data to create sample chapters with PENDING moderation status (PostgreSQL)
-- This will help verify the pending chapters display functionality

-- First, create a test user if not exists
INSERT INTO users (id, email, username, display_name, password_hash, role, status, created_at) 
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'testauthor@example.com', 'testauthor', 'Test Author', '$2a$10$dummy.hash.for.testing', 'user', 'active', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create a test category if not exists
INSERT INTO categories (id, name, description, slug, is_active, created_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440002', 'Fantasy', 'Fantasy stories and adventures', 'fantasy', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Create a test story
INSERT INTO stories (id, author_id, title, description, category_id, status, moderation_status, created_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Test Story for Moderation', 'A test story to verify moderation queue functionality', '550e8400-e29b-41d4-a716-446655440002', 'draft', 'pending', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test chapters with PENDING moderation status
INSERT INTO chapters (id, story_id, chapter_number, title, content, word_count, status, moderation_status, created_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 1, 'Chapter 1: The Beginning', 'This is the first chapter of our test story. It contains some content that needs to be moderated before publication.', 150, 'draft', 'pending', NOW()),
    ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 2, 'Chapter 2: The Journey Continues', 'The second chapter continues the adventure. This chapter also requires moderation approval.', 200, 'draft', 'pending', NOW()),
    ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 3, 'Chapter 3: New Challenges', 'In this chapter, our heroes face new challenges that test their resolve and determination.', 180, 'draft', 'pending', NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify the data was inserted
SELECT 
    c.id,
    c.title,
    c.chapter_number,
    c.moderation_status,
    c.created_at,
    s.title as story_title,
    u.username as author_username
FROM chapters c
JOIN stories s ON c.story_id = s.id
JOIN users u ON s.author_id = u.id
WHERE c.moderation_status = 'pending'
ORDER BY c.created_at ASC;