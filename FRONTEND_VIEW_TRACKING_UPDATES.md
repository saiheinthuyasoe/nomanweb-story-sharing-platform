# Frontend View Tracking Updates

## Overview

The frontend has been updated to work with the new view tracking system that prevents duplicate view counts on both books (stories) and chapters.

## Changes Made

### 1. Story Page View Tracking

**File:** `nomanweb_frontend/src/app/stories/[id]/page.tsx`

**Changes:**
- Added import for `useIncrementStoryView` hook
- Added view tracking logic that triggers when a user visits a story page
- Only tracks views for non-authors (authors viewing their own stories don't count as views)

**Code Added:**
```typescript
import { 
  useStory, 
  usePublishStory, 
  useUnpublishStory, 
  useDeleteStory,
  useIncrementStoryView
} from '@/hooks/useStories';

// In component:
const { mutate: incrementStoryView } = useIncrementStoryView();

// Track story view when component mounts and story is loaded
useEffect(() => {
  if (story && !isAuthor) {
    // Only track view if user is not the author
    incrementStoryView(storyId);
  }
}, [story, isAuthor, storyId, incrementStoryView]);
```

### 2. Chapter View Tracking

**File:** `nomanweb_frontend/src/app/stories/[id]/chapters/[chapterNumber]/read/page.tsx`

**Status:** ✅ Already working
- Chapter views are automatically tracked when users access chapters through the API
- The backend `ChapterController` handles view tracking when chapters are fetched
- Reading progress updates also trigger view tracking

### 3. Existing Hooks and APIs

**File:** `nomanweb_frontend/src/hooks/useStories.ts`

**Status:** ✅ Already exists
- `useIncrementStoryView` hook is already implemented
- Uses the `/api/stories/{id}/view` endpoint

**File:** `nomanweb_frontend/src/lib/api/stories.ts`

**Status:** ✅ Already exists
- `incrementStoryView` API function is already implemented

## How It Works

### Story View Tracking
1. User visits a story page (`/stories/[id]`)
2. Frontend checks if user is the author
3. If not the author, calls `incrementStoryView(storyId)`
4. Backend `ViewTrackingService` checks if user has viewed within 24 hours
5. If not within cooldown, increments view count and updates tracking records

### Chapter View Tracking
1. User accesses a chapter (through API calls)
2. Backend `ChapterController` automatically calls `viewTrackingService.trackChapterView()`
3. View tracking service checks cooldown period
4. If valid, increments chapter view and associated story view

### Reading Progress Tracking
1. User reads a chapter and progress is updated
2. `ReadingProgressController` calls view tracking service
3. Views are only counted on first read (when progress was 0)

## Benefits

1. **Accurate View Counts**: Prevents duplicate counting from same user
2. **Author Protection**: Authors viewing their own content don't inflate view counts
3. **Cooldown Protection**: 24-hour cooldown prevents rapid refresh manipulation
4. **Automatic Tracking**: No additional frontend code needed for chapter views
5. **Consistent Data**: Story and chapter views are automatically synchronized

## Testing

### Manual Testing
1. **Story View Tracking:**
   - Visit a story page as a non-author
   - Check that view count increases
   - Refresh page within 24 hours - view count should not increase
   - Visit as author - view count should not increase

2. **Chapter View Tracking:**
   - Read a chapter as a non-author
   - Check that both chapter and story view counts increase
   - Re-read within 24 hours - view counts should not increase

3. **Reading Progress:**
   - Start reading a chapter (progress = 0)
   - View should be counted
   - Continue reading (progress > 0)
   - Additional progress updates should not count as new views

### API Testing
```bash
# Test story view tracking
POST /api/stories/{storyId}/view

# Test chapter view tracking (automatic when accessing chapters)
GET /api/chapters/{chapterId}

# Test reading progress with view tracking
POST /api/reading-progress/chapter/{chapterId}/update?progressPercentage=10
```

## Configuration

### Cooldown Period
The 24-hour cooldown period is configured in the backend:
```java
private static final int VIEW_COOLDOWN_HOURS = 24;
```

### Anonymous Users
- Anonymous users are still tracked but with limited functionality
- Their views are counted but not stored in tracking tables
- This maintains backward compatibility for public access

## Monitoring

### Frontend Logs
- View tracking calls are logged in the browser console
- Failed API calls show error messages
- Success/failure feedback through toast notifications

### Backend Logs
- Detailed logging of view tracking operations
- Cooldown period checks
- Migration process logs

## Future Enhancements

1. **Real-time View Updates**: WebSocket-based real-time view count updates
2. **View Analytics**: Detailed view analytics dashboard
3. **Custom Cooldown**: Different cooldown periods for different content types
4. **View Attribution**: Track views by source (direct, search, social, etc.)

## Troubleshooting

### Common Issues

1. **Views Not Counting**
   - Check if user is within 24-hour cooldown period
   - Verify user is not the author of the content
   - Check browser console for API errors

2. **Duplicate Views**
   - Ensure backend migration has been run
   - Check that view tracking tables exist
   - Verify unique constraints are working

3. **Performance Issues**
   - Monitor API response times
   - Check database query performance
   - Consider caching for high-traffic scenarios 