# Social Features Testing Checklist

## 📖 Story Pages

### Story Detail Page (`/stories/[id]`)
- [x] **Like Button** - Toggle story like/unlike
- [x] **Share Button** - Share story via native sharing API
- [x] **Bookmark Button** - Add/remove from reading list
- [ ] **Comment Section** - View story comments
- [ ] **Comment Form** - Post new comments on story
- [X] **Like Count Display** - Show total story likes
- [ ] **Comment Count Display** - Show total story comments

### Chapter Detail Page (`/stories/[id]/chapters/[chapterNumber]`)
- [X] **Like Button** - Toggle chapter like/unlike
- [x] **Share Button** - Share chapter via native sharing API
- [X] **Like Count Display** - Show total chapter likes

### Chapter Read Page (`/stories/[id]/chapters/[chapterNumber]/read`)
- [x] **Like Button** - Toggle chapter like/unlike with heart icon
- [ ] **Report Button** - Report inappropriate content
- [ ] **Comment Section** - View chapter comments
- [ ] **Comment Form** - Post new comments on chapter
- [ ] **Like Count Display** - Show total chapter likes with count

## 👤 User Profile Pages

### Author Profile Page (`/authors/[authorId]`)
- [ ] **Follow Button** - Follow/unfollow author
- [ ] **Follow Status** - Display "Following" or "Follow" text
- [ ] **Follow Count Display** - Show follower/following counts
- [ ] **Followers Tab** - View author's followers list
- [ ] **Following Tab** - View who author is following
- [ ] **More Options Button** - Additional actions menu

### User Profile Page (`/profile`)
- [ ] **Followers Tab** - View your followers list
- [ ] **Following Tab** - View who you're following
- [ ] **Follower Count Display** - Show your follower count
- [ ] **Following Count Display** - Show your following count
- [ ] **Profile Stats** - Display engagement statistics

## 🎯 Dashboard Pages

### Main Dashboard (`/dashboard`)
- [ ] **Follower Count Card** - Display total followers
- [ ] **Engagement Stats** - Show likes, comments, views

### Alerts Page (`/dashboard/alerts`)
- [ ] **New Follower Notifications** - Show follower alerts
- [ ] **Like Notifications** - Show like alerts
- [ ] **Comment Notifications** - Show comment alerts
- [ ] **Filter by Alert Type** - Filter followers, likes, comments

### My Stories Page (`/dashboard/my-stories`)
- [ ] **Story Like Counts** - Display likes per story
- [ ] **Story Comment Counts** - Display comments per story
- [ ] **Share Story Button** - Share individual stories

## 🔍 Component-Level Features

### Story Cards (Used in Lists)
- [ ] **Like Count Display** - Show story likes
- [ ] **Author Link** - Navigate to author profile
- [ ] **Story Engagement Stats** - Views, likes, comments

### Chapter Management
- [ ] **Chapter Like Display** - Show likes per chapter
- [ ] **Chapter Engagement Stats** - Display chapter metrics

### Comments System
- [ ] **Post Comment** - Create new comments
- [ ] **Reply to Comments** - Reply to existing comments
- [ ] **Like Comments** - Toggle comment likes
- [ ] **Edit Comments** - Modify your comments
- [ ] **Delete Comments** - Remove your comments
- [ ] **Pin Comments** - Pin important comments (admin)
- [ ] **Flag Comments** - Report inappropriate comments
- [ ] **Comment Moderation** - Approve/reject comments (admin)

### Reading Lists & Bookmarks
- [ ] **Add to Reading List** - Bookmark stories
- [ ] **Reading Status** - Mark as "Want to Read", "Reading", "Completed", "Favorite"
- [ ] **View Reading Lists** - Access bookmarked stories
- [ ] **Update Reading Status** - Change reading progress

## 🔔 Notifications
- [ ] **Like Notifications** - Receive alerts for likes
- [ ] **Comment Notifications** - Receive alerts for comments
- [ ] **Follow Notifications** - Receive alerts for new followers
- [ ] **Reply Notifications** - Receive alerts for comment replies

## 📱 Mobile Navigation
- [ ] **Bookmark Icon** - Access reading lists from navbar
- [ ] **Profile Access** - Navigate to profile from navbar
- [ ] **Dashboard Access** - Access dashboard from navbar

## 🔄 Real-time Features
- [ ] **Live Like Updates** - Immediate like count updates
- [ ] **Live Comment Updates** - Real-time comment posting
- [ ] **Live Follow Updates** - Immediate follow status changes
- [ ] **Toast Notifications** - Success/error messages for all actions

## 🎨 UI/UX Features
- [ ] **Loading States** - Show loading for all social actions
- [ ] **Error Handling** - Display error messages appropriately
- [ ] **Success Feedback** - Confirm successful actions
- [ ] **Disabled States** - Disable buttons during processing
- [ ] **Visual Feedback** - Highlight active states (liked, following, etc.)

## 🧪 Testing Scenarios

### Authentication Required
- [ ] **Logged Out State** - Verify login prompts for social actions
- [ ] **Logged In State** - Verify social actions work when authenticated

### Edge Cases
- [ ] **Empty States** - No comments, followers, etc.
- [ ] **Large Numbers** - Test with high like/follower counts
- [ ] **Network Errors** - Test offline/slow connection scenarios
- [ ] **Duplicate Actions** - Prevent double-clicking issues

### Cross-Page Consistency
- [ ] **Like Count Sync** - Verify counts match across pages
- [ ] **Follow Status Sync** - Verify follow status is consistent
- [ ] **Comment Count Sync** - Verify comment counts match

---

## 📋 Summary of Social Features

**Total Social Features Identified: 30+**

1. **Reactions**: Story likes, chapter likes, comment likes
2. **Following**: Follow/unfollow users, view followers/following
3. **Comments**: Create, reply, edit, delete, pin, flag, moderate
4. **Bookmarks**: Reading lists with different statuses
5. **Sharing**: Native sharing for stories and chapters
6. **Notifications**: Real-time alerts for social interactions
7. **Reporting**: Flag inappropriate content
8. **Engagement Stats**: View counts, like counts, follower counts

Use this checklist to systematically test each feature and ensure they're working correctly across all pages and components!