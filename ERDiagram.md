erDiagram
    %% User Management
    users ||--o{ stories : "writes"
    users ||--o{ chapters : "creates"
    users ||--o{ comments : "posts"
    users ||--o{ reactions : "gives"
    users ||--o{ coin_transactions : "has"
    users ||--o{ notifications : "receives"
    users ||--o{ reading_progress : "tracks"
    users ||--o{ reading_lists : "maintains"
    users ||--o{ user_follows : "follows"
    users ||--o{ user_follows : "followed_by"
    users ||--o{ gift_transactions : "sends"
    users ||--o{ gift_transactions : "receives"
    users ||--o{ chapter_purchases : "purchases"
    users ||--o{ user_reports : "reports"
    users ||--o{ user_reports : "reported"
    users ||--o{ password_reset_attempts : "attempts"
    users ||--o{ email_verification_tokens : "verifies"
    users ||--o{ user_analytics : "tracked"
    users ||--o{ user_preferences : "prefers"
    users ||--o{ recommendation_history : "recommended"
    users ||--o{ moderation_logs : "moderates"
    users ||--o{ system_settings : "configures"

    %% Categories and Stories
    categories ||--o{ stories : "categorizes"
    
    %% Stories and Chapters
    stories ||--o{ chapters : "contains"
    stories ||--o{ comments : "receives"
    stories ||--o{ reactions : "gets"
    stories ||--o{ reading_progress : "tracked"
    stories ||--o{ reading_lists : "listed_in"
    stories ||--o{ gift_transactions : "receives_gifts"
    stories ||--o{ chapter_purchases : "purchased"
    stories ||--o{ story_analytics : "tracked"
    stories ||--o{ recommendation_history : "recommended"
    
    %% Chapters
    chapters ||--o{ comments : "receives"
    chapters ||--o{ reactions : "gets"
    chapters ||--o{ reading_progress : "tracked"
    chapters ||--o{ gift_transactions : "receives_gifts"
    chapters ||--o{ chapter_purchases : "purchased"
    
    %% Comments
    comments ||--o{ comments : "replies_to"
    comments ||--o{ reactions : "gets"
    
    %% Gifts
    gifts ||--o{ gift_transactions : "used_in"
    
    %% Coin System
    coin_packages ||--o{ coin_transactions : "purchased"
    
    users {
        UUID id PK
        string email UK
        string username UK
        string display_name
        string password_hash
        string profile_image_url
        text bio
        enum role
        enum status
        decimal coin_balance
        decimal total_earned_coins
        string line_user_id
        string google_id
        boolean email_verified
        string password_reset_token
        timestamp password_reset_expires
        timestamp last_password_change
        timestamp last_login_at
        timestamp created_at
        timestamp updated_at
    }
    
    password_reset_attempts {
        UUID id PK
        string email
        string ip_address
        text user_agent
        boolean token_generated
        boolean success
        timestamp created_at
    }
    
    email_verification_tokens {
        UUID id PK
        UUID user_id FK
        string token UK
        timestamp expires_at
        boolean used
        timestamp created_at
        timestamp used_at
    }
    
    user_follows {
        UUID id PK
        UUID follower_id FK
        UUID following_id FK
        timestamp created_at
    }
    
    categories {
        UUID id PK
        string name UK
        text description
        string slug UK
        boolean is_active
        timestamp created_at
    }
    
    stories {
        UUID id PK
        UUID author_id FK
        string title
        text description
        string cover_image_url
        UUID category_id FK
        enum status
        enum content_type
        int total_chapters
        bigint total_views
        bigint total_likes
        bigint total_comments
        decimal total_coins_earned
        boolean is_featured
        enum moderation_status
        text moderation_notes
        json tags
        timestamp created_at
        timestamp updated_at
        timestamp published_at
    }
    
    chapters {
        UUID id PK
        UUID story_id FK
        int chapter_number
        string title
        longtext content
        int word_count
        decimal coin_price
        boolean is_free
        enum status
        bigint views
        bigint likes
        enum moderation_status
        text moderation_notes
        timestamp created_at
        timestamp updated_at
        timestamp published_at
    }
    
    reading_progress {
        UUID id PK
        UUID user_id FK
        UUID story_id FK
        UUID chapter_id FK
        decimal progress_percentage
        timestamp last_read_at
    }
    
    reading_lists {
        UUID id PK
        UUID user_id FK
        UUID story_id FK
        enum list_type
        timestamp added_at
    }
    
    comments {
        UUID id PK
        UUID user_id FK
        UUID story_id FK
        UUID chapter_id FK
        UUID parent_comment_id FK
        text content
        bigint likes
        boolean is_pinned
        enum moderation_status
        text moderation_notes
        timestamp created_at
        timestamp updated_at
    }
    
    reactions {
        UUID id PK
        UUID user_id FK
        enum target_type
        UUID target_id
        enum reaction_type
        timestamp created_at
    }
    
    coin_packages {
        UUID id PK
        string name
        int coin_amount
        decimal price_thb
        int bonus_coins
        decimal service_fee_percentage
        boolean is_active
        timestamp created_at
    }
    
    coin_transactions {
        UUID id PK
        UUID user_id FK
        enum transaction_type
        decimal amount
        decimal balance_after
        enum reference_type
        UUID reference_id
        enum status
        enum payment_method
        string payment_reference
        text notes
        UUID processed_by FK
        timestamp created_at
        timestamp processed_at
    }
    
    gifts {
        UUID id PK
        string name
        text description
        string icon_url
        int coin_cost
        boolean is_active
        timestamp created_at
    }
    
    gift_transactions {
        UUID id PK
        UUID gift_id FK
        UUID sender_id FK
        UUID recipient_id FK
        UUID story_id FK
        UUID chapter_id FK
        int quantity
        decimal total_coins
        text message
        timestamp created_at
    }
    
    chapter_purchases {
        UUID id PK
        UUID user_id FK
        UUID chapter_id FK
        UUID story_id FK
        decimal coins_spent
        timestamp purchased_at
    }
    
    notifications {
        UUID id PK
        UUID user_id FK
        enum type
        string title
        text message
        enum related_type
        UUID related_id
        boolean is_read
        boolean sent_via_line
        string line_message_id
        timestamp created_at
        timestamp read_at
    }
    
    moderation_logs {
        UUID id PK
        enum content_type
        UUID content_id
        UUID moderator_id FK
        enum action
        text reason
        decimal ai_confidence_score
        json flagged_content
        timestamp created_at
    }
    
    user_reports {
        UUID id PK
        UUID reporter_id FK
        UUID reported_user_id FK
        enum content_type
        UUID content_id
        enum reason
        text description
        enum status
        UUID resolved_by FK
        text resolution_notes
        timestamp created_at
        timestamp resolved_at
    }
    
    user_analytics {
        UUID id PK
        UUID user_id FK
        date date
        int stories_read
        int chapters_read
        int time_spent_minutes
        decimal coins_spent
        decimal coins_earned
    }
    
    story_analytics {
        UUID id PK
        UUID story_id FK
        date date
        int views
        int unique_readers
        int likes
        int comments
        decimal coins_earned
    }
    
    user_preferences {
        UUID id PK
        UUID user_id FK
        json preferred_categories
        json preferred_tags
        enum reading_time_preference
        enum content_preference
        timestamp updated_at
    }
    
    recommendation_history {
        UUID id PK
        UUID user_id FK
        UUID story_id FK
        decimal recommendation_score
        json recommendation_reason
        timestamp shown_at
        boolean clicked
        timestamp clicked_at
    }
    
    system_settings {
        UUID id PK
        string setting_key UK
        text setting_value
        text description
        UUID updated_by FK
        timestamp updated_at
    }