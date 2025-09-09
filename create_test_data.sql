-- Create test data for NoManWeb platform
-- This script creates users, categories, stories, chapters, and engagement data
-- PostgreSQL version

-- Connect to nomanweb database (run with: psql -U postgres -d nomanweb -f create_test_data.sql)

-- First, create test users
INSERT INTO users (
    id, email, username, display_name, password_hash, role, status, email_verified, 
    coin_balance, total_earned_coins, bio, created_at, updated_at
) VALUES 
-- User 1: zaiaegaming@gmail.com
(
    gen_random_uuid(), 
    'zaiaegaming@gmail.com', 
    'zaiaegaming', 
    'Zaia Gaming Writer',
    '$2a$10$GJ2n.EfFPRAnsHdglYwJd.jFq5NjMnKYc/iCn8YIs/ge/xCbbQTJe', -- password: password123
    'USER', 
    'ACTIVE',
    true, 
    150.00, 
    75.50, 
    'Passionate storyteller who loves creating immersive fantasy worlds and gaming adventures.',
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
),
-- User 2: takashiakio280@gmail.com
(
    gen_random_uuid(), 
    'takashiakio280@gmail.com', 
    'takashiakio280', 
    'Takashi Akio',
    '$2a$10$GJ2n.EfFPRAnsHdglYwJd.jFq5NjMnKYc/iCn8YIs/ge/xCbbQTJe', -- password: password123
    'USER', 
    'ACTIVE',
    true, 
    200.00, 
    120.75, 
    'Japanese culture enthusiast and mystery writer. Specializes in psychological thrillers and slice-of-life stories.',
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
),
-- User 3: saiheinthuyasoe@gmail.com
(
    gen_random_uuid(), 
    'saiheinthuyasoe@gmail.com', 
    'saiheinthuyasoe', 
    'Sai Hein Thu Ya Soe',
    '$2a$10$GJ2n.EfFPRAnsHdglYwJd.jFq5NjMnKYc/iCn8YIs/ge/xCbbQTJe', -- password: password123
    'USER', 
    'ACTIVE',
    true, 
    300.00, 
    180.25, 
    'Myanmar author passionate about cultural stories, romance, and contemporary fiction.',
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Create categories if they don't exist
INSERT INTO categories (id, name, description, slug, is_active, created_at) VALUES 
(gen_random_uuid(), 'Fantasy', 'Epic fantasy adventures with magic and mythical creatures', 'fantasy', true, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Romance', 'Love stories and romantic adventures', 'romance', true, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Mystery', 'Suspenseful stories with puzzles to solve', 'mystery', true, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Science Fiction', 'Futuristic stories with advanced technology', 'science-fiction', true, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Adventure', 'Action-packed journeys and quests', 'adventure', true, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Drama', 'Character-driven stories with emotional depth', 'drama', true, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- Create stories for each user
-- Stories for zaiaegaming@gmail.com
INSERT INTO stories (
    id, author_id, title, description, category_id, publish_status, pricing_type, book_status,
    total_chapters, total_views, total_likes, is_featured, moderation_status,
    created_at, updated_at, published_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM users WHERE email = 'zaiaegaming@gmail.com'),
    'The Dragon''s Quest: Legends of Aethermoor',
    'In the mystical realm of Aethermoor, young warrior Kael discovers he is the last Dragon Rider. With his dragon companion Zephyr, he must unite the scattered kingdoms to face an ancient evil that threatens to consume all worlds.',
    (SELECT id FROM categories WHERE slug = 'fantasy'),
    'PUBLISHED',
    'FREE',
    'ONGOING',
    8,
    2547,
    189,
    true,
    'APPROVED',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '25 days'
),
(
    gen_random_uuid(),
    (SELECT id FROM users WHERE email = 'zaiaegaming@gmail.com'),
    'Cyber Nexus: The Digital Awakening',
    'In 2087, hacker Maya Chen discovers a conspiracy that goes deeper than the virtual reality networks everyone depends on. As she uncovers the truth, she must choose between saving humanity or preserving the digital world she calls home.',
    (SELECT id FROM categories WHERE slug = 'science-fiction'),
    'PUBLISHED',
    'PAID_PER_CHAPTER',
    'ONGOING',
    5,
    1823,
    142,
    false,
    'APPROVED',
    CURRENT_TIMESTAMP - INTERVAL '20 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '18 days'
);

-- Stories for takashiakio280@gmail.com
INSERT INTO stories (
    id, author_id, title, description, category_id, publish_status, pricing_type, book_status,
    total_chapters, total_views, total_likes, is_featured, moderation_status,
    created_at, updated_at, published_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM users WHERE email = 'takashiakio280@gmail.com'),
    'The Silent Observer',
    'Detective Hiroshi Tanaka thought he had seen everything in Tokyo''s criminal underworld. But when a series of impossible murders begins, each victim found in locked rooms with no way in or out, he must confront a mystery that challenges everything he believes about reality.',
    (SELECT id FROM categories WHERE slug = 'mystery'),
    'PUBLISHED',
    'WHOLE_BOOK',
    'COMPLETED',
    12,
    3421,
    267,
    true,
    'APPROVED',
    CURRENT_TIMESTAMP - INTERVAL '45 days',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '40 days'
),
(
    gen_random_uuid(),
    (SELECT id FROM users WHERE email = 'takashiakio280@gmail.com'),
    'Cherry Blossoms in Winter',
    'A heartwarming slice-of-life story about Yuki, a young woman who inherits her grandmother''s traditional tea house in Kyoto. As she learns the ancient art of tea ceremony, she discovers family secrets and finds unexpected love.',
    (SELECT id FROM categories WHERE slug = 'romance'),
    'PUBLISHED',
    'FREE',
    'ONGOING',
    7,
    1956,
    203,
    false,
    'APPROVED',
    CURRENT_TIMESTAMP - INTERVAL '25 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '22 days'
);

-- Stories for saiheinthuyasoe@gmail.com
INSERT INTO stories (
    id, author_id, title, description, category_id, publish_status, pricing_type, book_status,
    total_chapters, total_views, total_likes, is_featured, moderation_status,
    created_at, updated_at, published_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM users WHERE email = 'saiheinthuyasoe@gmail.com'),
    'Golden Pagoda Dreams',
    'Set in modern-day Yangon, this story follows Thant, a young architect who returns to Myanmar after studying abroad. As he works to restore ancient pagodas, he reconnects with his cultural roots and finds love with Khin, a traditional artist.',
    (SELECT id FROM categories WHERE slug = 'romance'),
    'PUBLISHED',
    'PAID_PER_CHAPTER',
    'ONGOING',
    9,
    2134,
    178,
    true,
    'APPROVED',
    CURRENT_TIMESTAMP - INTERVAL '35 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '30 days'
),
(
    gen_random_uuid(),
    (SELECT id FROM users WHERE email = 'saiheinthuyasoe@gmail.com'),
    'The Monsoon Chronicles',
    'An epic family saga spanning three generations in Myanmar, from the colonial era through independence to modern times. Follow the Htun family as they navigate political upheaval, cultural change, and the enduring power of family bonds.',
    (SELECT id FROM categories WHERE slug = 'drama'),
    'PUBLISHED',
    'FREE',
    'ONGOING',
    6,
    1687,
    156,
    false,
    'APPROVED',
    CURRENT_TIMESTAMP - INTERVAL '28 days',
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '26 days'
);

-- Now create chapters for each story
-- Chapters for "The Dragon's Quest: Legends of Aethermoor"
INSERT INTO chapters (
    id, story_id, chapter_number, title, content, word_count, coin_price, is_free, status, 
    views, likes, moderation_status, created_at, updated_at, published_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM stories WHERE title = 'The Dragon''s Quest: Legends of Aethermoor'),
    1,
    'The Awakening',
    'The morning sun cast long shadows across the training grounds of Drakmoor Academy. Kael Stormwind, barely eighteen and already showing promise as a warrior, had no idea that this day would change his life forever. As he practiced his sword forms, a distant roar echoed across the mountains—a sound that had not been heard in over a century. The roar of a dragon.\n\nKael dropped his practice sword, his heart racing. According to legend, dragons had vanished from Aethermoor long ago, taking with them the Dragon Riders who once protected the realm. But as a massive shadow passed overhead, Kael knew the legends were wrong.\n\nThe dragon landed in the courtyard with earth-shaking force. Its scales shimmered like liquid silver, and its eyes held an ancient wisdom. "You are the one," it spoke directly into Kael''s mind. "I am Zephyr, and you, young warrior, are my Rider. The darkness stirs, and Aethermoor needs its protectors once more."',
    1247,
    0.00,
    true,
    'PUBLISHED',
    456,
    34,
    'APPROVED',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP - INTERVAL '30 days',
    CURRENT_TIMESTAMP - INTERVAL '25 days'
),
(
    gen_random_uuid(),
    (SELECT id FROM stories WHERE title = 'The Dragon''s Quest: Legends of Aethermoor'),
    2,
    'The Bond Forged',
    'The bonding ceremony between Dragon and Rider was unlike anything Kael had imagined. As Zephyr''s consciousness merged with his own, he experienced centuries of dragon memory—the great wars, the fall of the Dragon Riders, and the growing shadow that threatened to return.\n\n"The Shadow Lord Malachar was not destroyed," Zephyr explained as they soared above the clouds. "He was merely banished to the Void Realm. But the barriers weaken, and his influence seeps back into our world."\n\nBelow them, the kingdoms of Aethermoor spread out like a patchwork quilt. The Northern Ice Kingdoms, the Desert Sultanates, the Forest Realms, and the Island Nations—all would need to unite if they hoped to stand against the coming darkness.\n\n"But first," Zephyr continued, "you must learn to truly fly." With that, the dragon rolled inverted, and Kael''s training as a Dragon Rider truly began.',
    1156,
    0.00,
    true,
    'PUBLISHED',
    398,
    28,
    'APPROVED',
    CURRENT_TIMESTAMP - INTERVAL '28 days',
    CURRENT_TIMESTAMP - INTERVAL '28 days',
    CURRENT_TIMESTAMP - INTERVAL '23 days'
);

-- Chapters for "The Silent Observer"
INSERT INTO chapters (
    id, story_id, chapter_number, title, content, word_count, coin_price, is_free, status, 
    views, likes, moderation_status, created_at, updated_at, published_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM stories WHERE title = 'The Silent Observer'),
    1,
    'The Impossible Room',
    'Detective Hiroshi Tanaka had seen his share of crime scenes in twenty years with the Tokyo Metropolitan Police, but nothing had prepared him for this. The victim, Kenji Nakamura, lay in the center of his study, a knife protruding from his chest. The door had been locked from the inside, the key still in the lock. The windows were sealed shut and painted over years ago. There was no other way in or out.\n\n"Suicide?" suggested Officer Sato, though his voice lacked conviction.\n\nTanaka shook his head, studying the angle of the wound. "The knife entered from behind and slightly upward. Impossible angle for self-infliction." He walked the perimeter of the room, his trained eye cataloging every detail. "Someone was in this room with Nakamura. Someone who vanished into thin air."\n\nAs he examined the victim''s desk, Tanaka noticed something odd—a single white chess piece, a king, placed precisely in the center of the blotter. Nakamura wasn''t known to play chess. The detective carefully bagged the piece, unaware that it was the first clue in a game far more complex than he could imagine.',
    1389,
    2.50,
    false,
    'PUBLISHED',
    523,
    41,
    'APPROVED',
    CURRENT_TIMESTAMP - INTERVAL '45 days',
    CURRENT_TIMESTAMP - INTERVAL '45 days',
    CURRENT_TIMESTAMP - INTERVAL '40 days'
),
(
    gen_random_uuid(),
    (SELECT id FROM stories WHERE title = 'The Silent Observer'),
    2,
    'The Second Impossibility',
    'Three days later, the second murder shattered any hope that Nakamura''s death was an isolated incident. Yuki Sato, a prominent art dealer, was found dead in her gallery''s vault. Like Nakamura, she had been stabbed from behind. Like Nakamura, she was found in a room that had been locked from the inside.\n\nBut this time, there were witnesses.\n\n"I was watching the vault door the entire time," insisted the gallery''s security guard, his hands shaking as he gave his statement. "Ms. Sato went in alone to check on a new acquisition. I heard her scream, but when I opened the door—it takes two keys, mine and hers—she was already dead. No one else was in there."\n\nTanaka examined the vault carefully. No hidden passages, no air ducts large enough for a person, no secret panels. And there, placed on a pedestal next to a priceless Ming vase, was another white chess piece—this time, a queen.\n\n"We''re dealing with someone who wants to play games," Tanaka muttered to his partner. "The question is: what are the rules?"',
    1298,
    2.50,
    false,
    'PUBLISHED',
    467,
    38,
    'APPROVED',
    CURRENT_TIMESTAMP - INTERVAL '43 days',
    CURRENT_TIMESTAMP - INTERVAL '43 days',
    CURRENT_TIMESTAMP - INTERVAL '38 days'
);

-- Chapters for "Golden Pagoda Dreams"
INSERT INTO chapters (
    id, story_id, chapter_number, title, content, word_count, coin_price, is_free, status, 
    views, likes, moderation_status, created_at, updated_at, published_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT id FROM stories WHERE title = 'Golden Pagoda Dreams'),
    1,
    'Homecoming',
    'The heat hit Thant like a wall as he stepped off the plane at Yangon International Airport. After five years in London studying architecture, the familiar humidity of Myanmar felt both foreign and like coming home. The city had changed—new buildings reached toward the sky, modern cars shared the roads with traditional trishaws, and everywhere there were signs of a country in transition.\n\nHis taxi wound through streets he remembered from childhood, past the golden spires of Shwedagon Pagoda gleaming in the afternoon sun. But it was the smaller pagodas, the ones tucked away in neighborhoods and forgotten by tourists, that had brought him home.\n\n"The Htauk Kyant Pagoda restoration project," his supervisor had called it. "A chance to preserve Myanmar''s architectural heritage while incorporating modern conservation techniques." For Thant, it was something more—a chance to reconnect with the culture he had left behind in his pursuit of Western education.\n\nAs the taxi pulled up to his family''s house in the old quarter, Thant saw his grandmother waiting on the porch, her face creased with the smile he remembered from his childhood. "Welcome home, my grandson," she said in Burmese, and for the first time in years, Thant felt truly at peace.',
    1234,
    1.50,
    false,
    'PUBLISHED',
    387,
    29,
    'APPROVED',
    CURRENT_TIMESTAMP - INTERVAL '35 days',
    CURRENT_TIMESTAMP - INTERVAL '35 days',
    CURRENT_TIMESTAMP - INTERVAL '30 days'
),
(
    gen_random_uuid(),
    (SELECT id FROM stories WHERE title = 'Golden Pagoda Dreams'),
    2,
    'The Artist''s Touch',
    'Thant first saw Khin at the pagoda site, her delicate hands carefully applying gold leaf to a restored Buddha statue. She worked with the concentration of a master craftsman, each movement precise and reverent. The morning light filtering through the pagoda''s windows seemed to dance around her, highlighting the traditional thanaka paste on her cheeks and the intricate patterns of her longyi.\n\n"Excuse me," Thant said in Burmese, not wanting to startle her. "I''m the architect for the restoration project. Your work is beautiful."\n\nKhin looked up, her dark eyes meeting his with a mixture of curiosity and wariness. "You''re the one who studied in London," she said. It wasn''t a question. "The elders have been talking about you. They wonder if you still remember our ways."\n\nThant felt heat rise in his cheeks. "I... I hope to learn again. To remember."\n\nA small smile played at the corners of Khin''s mouth. "Then perhaps you should start by learning why we apply the gold leaf in this particular pattern. Each stroke has meaning, each layer tells a story of devotion passed down through generations."\n\nAs she began to explain the ancient techniques, Thant realized he was learning about much more than restoration. He was rediscovering his heritage, one golden brushstroke at a time.',
    1298,
    1.50,
    false,
    'PUBLISHED',
    342,
    26,
    'APPROVED',
    CURRENT_TIMESTAMP - INTERVAL '33 days',
    CURRENT_TIMESTAMP - INTERVAL '33 days',
    CURRENT_TIMESTAMP - INTERVAL '28 days'
);

-- Add some story views and reactions for realistic engagement
INSERT INTO story_views (id, user_id, story_id, view_count, first_viewed_at, last_viewed_at) 
SELECT 
    gen_random_uuid(),
    u.id,
    s.id,
    floor(random() * 10 + 1)::integer,
    CURRENT_TIMESTAMP - INTERVAL '30 days' + (random() * INTERVAL '25 days'),
    CURRENT_TIMESTAMP - INTERVAL '5 days' + (random() * INTERVAL '4 days')
FROM users u 
CROSS JOIN stories s 
WHERE u.email NOT IN ('zaiaegaming@gmail.com', 'takashiakio280@gmail.com', 'saiheinthuyasoe@gmail.com')
LIMIT 50;

-- Add some reactions (likes) to stories
INSERT INTO reactions (id, user_id, target_type, target_id, reaction_type, created_at)
SELECT 
    gen_random_uuid(),
    u.id,
    'STORY',
    s.id,
    'LIKE',
    CURRENT_TIMESTAMP - INTERVAL '30 days' + (random() * INTERVAL '25 days')
FROM users u 
CROSS JOIN stories s 
WHERE u.email NOT IN ('zaiaegaming@gmail.com', 'takashiakio280@gmail.com', 'saiheinthuyasoe@gmail.com')
AND random() < 0.3  -- 30% chance of liking each story
LIMIT 100;

-- Add some chapter views
INSERT INTO chapter_views (id, user_id, chapter_id, view_count, first_viewed_at, last_viewed_at)
SELECT 
    gen_random_uuid(),
    u.id,
    c.id,
    floor(random() * 5 + 1)::integer,
    CURRENT_TIMESTAMP - INTERVAL '25 days' + (random() * INTERVAL '20 days'),
    CURRENT_TIMESTAMP - INTERVAL '3 days' + (random() * INTERVAL '2 days')
FROM users u 
CROSS JOIN chapters c 
WHERE u.email NOT IN ('zaiaegaming@gmail.com', 'takashiakio280@gmail.com', 'saiheinthuyasoe@gmail.com')
LIMIT 75;

-- Add some reactions to chapters
INSERT INTO reactions (id, user_id, target_type, target_id, reaction_type, created_at)
SELECT 
    gen_random_uuid(),
    u.id,
    'CHAPTER',
    c.id,
    'LIKE',
    CURRENT_TIMESTAMP - INTERVAL '25 days' + (random() * INTERVAL '20 days')
FROM users u 
CROSS JOIN chapters c 
WHERE u.email NOT IN ('zaiaegaming@gmail.com', 'takashiakio280@gmail.com', 'saiheinthuyasoe@gmail.com')
AND random() < 0.25  -- 25% chance of liking each chapter
LIMIT 50;

COMMIT;

-- Display summary of created data
SELECT 'Test data creation completed!' as status;
SELECT 
    u.username,
    u.email,
    COUNT(s.id) as total_stories,
    SUM(s.total_chapters) as total_chapters,
    SUM(s.total_views) as total_views,
    SUM(s.total_likes) as total_likes
FROM users u
LEFT JOIN stories s ON u.id = s.author_id
WHERE u.email IN ('zaiaegaming@gmail.com', 'takashiakio280@gmail.com', 'saiheinthuyasoe@gmail.com')
GROUP BY u.id, u.username, u.email
ORDER BY u.username;