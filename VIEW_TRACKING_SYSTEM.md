# View Tracking System

## Overview

The view tracking system has been implemented to prevent duplicate view counts on both books (stories) and chapters. This system ensures that views are counted accurately and prevents inflation of view statistics.

## Key Features

### 1. User-Based View Tracking
- Each user's view of a chapter or story is tracked individually
- Views are only counted once per user per cooldown period (24 hours)
- Anonymous users are still tracked but with limited functionality

### 2. Cooldown Period
- 24-hour cooldown period between views for the same user
- Prevents rapid refresh/view manipulation
- Ensures more accurate view statistics

### 3. Automatic Story View Tracking
- When a chapter is viewed, the associated story view is also tracked
- Maintains consistency between chapter and story view counts

## Database Schema

### Chapter Views Table
```sql
CREATE TABLE chapter_views (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    chapter_id UUID NOT NULL,
    view_count INTEGER NOT NULL DEFAULT 1,
    first_viewed_at TIMESTAMP NOT NULL,
    last_viewed_at TIMESTAMP NOT NULL,
    UNIQUE KEY unique_chapter_view (user_id, chapter_id)
);
```

### Story Views Table
```sql
CREATE TABLE story_views (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    story_id UUID NOT NULL,
    view_count INTEGER NOT NULL DEFAULT 1,
    first_viewed_at TIMESTAMP NOT NULL,
    last_viewed_at TIMESTAMP NOT NULL,
    UNIQUE KEY unique_story_view (user_id, story_id)
);
```

## Implementation Details

### Services
- `ViewTrackingService`: Main service for tracking views
- `ViewMigrationService`: Service for migrating existing view counts

### Key Methods
- `trackChapterView(UUID chapterId, UUID userId)`: Tracks a chapter view
- `trackStoryView(UUID storyId, UUID userId)`: Tracks a story view
- `getChapterViewCount(UUID chapterId)`: Gets total view count for a chapter
- `getStoryViewCount(UUID storyId)`: Gets total view count for a story

### Controllers Updated
- `ChapterController`: Now uses `ViewTrackingService` instead of direct increment
- `StoryController`: Now uses `ViewTrackingService` for story views
- `ReadingProgressController`: Updated to use new tracking system
- `AdminController`: Added migration endpoint

## Migration Process

### 1. Database Migration
Run the SQL migration script:
```sql
-- Execute view_tracking_tables.sql
```

### 2. Application Migration
After deploying the new code, trigger the migration:
```bash
POST /api/admin/migrate-views
```

This will:
- Create view records for existing view counts
- Preserve historical view data
- Set up the new tracking system

## Usage Examples

### Tracking a Chapter View
```java
// In ChapterController
viewTrackingService.trackChapterView(chapterId, currentUserId);
```

### Tracking a Story View
```java
// In StoryController
viewTrackingService.trackStoryView(storyId, currentUserId);
```

### Getting View Counts
```java
Long chapterViews = viewTrackingService.getChapterViewCount(chapterId);
Long storyViews = viewTrackingService.getStoryViewCount(storyId);
```

## Benefits

1. **Accurate View Counts**: Prevents duplicate counting from the same user
2. **Anti-Manipulation**: 24-hour cooldown prevents view inflation
3. **Data Integrity**: Maintains consistency between chapter and story views
4. **Scalability**: Efficient database queries with proper indexing
5. **Backward Compatibility**: Existing view counts are preserved during migration

## Configuration

### Cooldown Period
The cooldown period can be adjusted in `ViewTrackingServiceImpl`:
```java
private static final int VIEW_COOLDOWN_HOURS = 24;
```

### Anonymous User Handling
- Anonymous users are still tracked but with limited functionality
- Their views are counted but not stored in the tracking tables
- This maintains backward compatibility for public access

## Monitoring

### Logging
The system provides detailed logging for:
- View tracking operations
- Migration processes
- Error conditions

### Metrics
Track the following metrics:
- Total views per chapter/story
- Unique viewers per chapter/story
- View frequency patterns

## Troubleshooting

### Common Issues

1. **Migration Fails**
   - Check database connectivity
   - Ensure all required tables exist
   - Verify user permissions

2. **View Counts Not Updating**
   - Check if user is within cooldown period
   - Verify tracking service is properly injected
   - Check database constraints

3. **Performance Issues**
   - Monitor database indexes
   - Check query performance
   - Consider caching for high-traffic scenarios

## Future Enhancements

1. **Analytics Dashboard**: Detailed view analytics
2. **Custom Cooldown Periods**: Different periods for different content types
3. **View Attribution**: Track views by source (direct, search, social, etc.)
4. **Real-time Updates**: WebSocket-based real-time view count updates 