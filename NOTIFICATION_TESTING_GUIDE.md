# Manual Testing Guide for Gmail and LINE Notifications

This guide provides step-by-step instructions for manually testing both Gmail email notifications and LINE Bot notifications in your application.

## Prerequisites

### Gmail/Email Setup
1. **SMTP Configuration**: Ensure your `application.properties` has valid SMTP settings:
   ```properties
   spring.mail.host=smtp.gmail.com
   spring.mail.port=587
   spring.mail.username=your-email@gmail.com
   spring.mail.password=your-app-password
   spring.mail.properties.mail.smtp.auth=true
   spring.mail.properties.mail.smtp.starttls.enable=true
   ```

2. **Gmail App Password**: 
   - Enable 2-factor authentication on your Gmail account
   - Generate an App Password: Google Account → Security → 2-Step Verification → App passwords
   - Use this App Password in your configuration

### LINE Bot Setup
1. **LINE Developer Console**:
   - Create a LINE Bot at https://developers.line.biz/
   - Get your Channel Access Token and Channel Secret
   - Set webhook URL to: `https://your-domain.com/api/line/webhook`

2. **Application Configuration**:
   ```properties
   line.bot.channel-token=your-channel-access-token
   line.bot.channel-secret=your-channel-secret
   line.bot.handler.path=/api/line/webhook
   ```

## Database Setup for Testing

### 1. Create Test Users with Notification Preferences

```sql
-- Create test users with different notification preferences
INSERT INTO users (id, username, email, password, display_name, is_active, 
                  email_notifications_enabled, line_notifications_enabled,
                  notify_new_followers, notify_likes, notify_comments, 
                  notify_new_stories, notify_new_chapters, notify_system_messages)
VALUES 
('11111111-1111-1111-1111-111111111111', 'testuser1', 'test1@gmail.com', 
 '$2a$10$encrypted_password', 'Test User 1', true, 
 true, true, true, true, true, true, true, true),

('22222222-2222-2222-2222-222222222222', 'testuser2', 'test2@gmail.com', 
 '$2a$10$encrypted_password', 'Test User 2', true, 
 true, false, true, true, true, true, true, true),

('33333333-3333-3333-3333-333333333333', 'testuser3', 'test3@gmail.com', 
 '$2a$10$encrypted_password', 'Test User 3', true, 
 false, true, true, true, true, true, true, true);
```

### 2. Add LINE User IDs (for LINE testing)

```sql
-- Update users with LINE user IDs (get these from LINE Bot interactions)
UPDATE users SET line_user_id = 'U1234567890abcdef' WHERE username = 'testuser1';
UPDATE users SET line_user_id = 'U0987654321fedcba' WHERE username = 'testuser3';
```

## Manual Testing Procedures

### Test 1: Follow Notification

**Setup:**
1. User A follows User B
2. User B should receive notifications

**API Call:**
```bash
curl -X POST http://localhost:8080/api/users/{userId}/follow \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json"
```

**Expected Results:**
- **Email**: User B receives email with subject "New Follower"
- **LINE**: User B receives LINE message (if LINE enabled)
- **Database**: New notification record created

### Test 2: Story Like Notification

**Setup:**
1. User A likes User B's story
2. User B should receive notifications

**API Call:**
```bash
curl -X POST http://localhost:8080/api/stories/{storyId}/like \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json"
```

**Expected Results:**
- **Email**: User B receives email about story like
- **LINE**: User B receives LINE message with story link
- **Database**: Notification with type 'LIKE' created

### Test 3: Comment Notification

**Setup:**
1. User A comments on User B's story/chapter
2. User B should receive notifications

**API Call:**
```bash
curl -X POST http://localhost:8080/api/stories/{storyId}/comments \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{"content": "Great story!"}'
```

**Expected Results:**
- **Email**: User B receives comment notification email
- **LINE**: User B receives LINE message with comment details
- **Database**: Notification with type 'COMMENT' created

### Test 4: New Chapter Notification

**Setup:**
1. User B publishes a new chapter
2. User B's followers should receive notifications

**API Call:**
```bash
curl -X POST http://localhost:8080/api/stories/{storyId}/chapters \
  -H "Authorization: Bearer {jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Chapter 5: The Adventure Continues",
    "content": "Chapter content here...",
    "isPublished": true
  }'
```

**Expected Results:**
- **Email**: All followers receive new chapter email
- **LINE**: All followers with LINE enabled receive messages
- **Database**: Multiple notifications created for each follower

### Test 5: System Notification

**Setup:**
1. Admin sends system notification
2. All users should receive notifications

**API Call:**
```bash
curl -X POST http://localhost:8080/api/admin/notifications/system \
  -H "Authorization: Bearer {admin_jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Maintenance Notice",
    "message": "The system will be under maintenance tomorrow."
  }'
```

**Expected Results:**
- **Email**: All users receive system notification email
- **LINE**: All users with LINE enabled receive messages
- **Database**: System notifications created for all users

## Testing Different User Preferences

### Test Scenario A: Email Only User
- User has `email_notifications_enabled = true`, `line_notifications_enabled = false`
- Should receive only email notifications
- No LINE messages should be sent

### Test Scenario B: LINE Only User
- User has `email_notifications_enabled = false`, `line_notifications_enabled = true`
- Should receive only LINE notifications
- No emails should be sent

### Test Scenario C: Both Channels User
- User has both `email_notifications_enabled = true` and `line_notifications_enabled = true`
- Should receive both email and LINE notifications

### Test Scenario D: Notifications Disabled User
- User has both `email_notifications_enabled = false` and `line_notifications_enabled = false`
- Should not receive any notifications
- Database records may still be created for audit purposes

## Verification Steps

### 1. Check Email Delivery
- Check Gmail inbox for test emails
- Verify email content and formatting
- Check spam folder if emails not received

### 2. Check LINE Messages
- Open LINE app on mobile device
- Verify messages from your bot
- Test action buttons/links in messages

### 3. Check Database Records
```sql
-- Check notification records
SELECT * FROM notifications 
WHERE user_id = '{test_user_id}' 
ORDER BY created_at DESC;

-- Check notification delivery status
SELECT 
    n.*,
    CASE WHEN n.sent_via_line THEN 'LINE Sent' ELSE 'LINE Not Sent' END as line_status
FROM notifications n
WHERE n.created_at > NOW() - INTERVAL '1 hour';
```

### 4. Check Application Logs
```bash
# Check for notification sending logs
grep -i "notification" logs/application.log

# Check for email sending logs
grep -i "email" logs/application.log

# Check for LINE messaging logs
grep -i "line" logs/application.log
```

## Troubleshooting Common Issues

### Email Not Received
1. **Check SMTP Configuration**: Verify Gmail SMTP settings
2. **App Password**: Ensure using App Password, not regular password
3. **Firewall**: Check if port 587 is blocked
4. **Spam Filter**: Check spam/junk folders
5. **Rate Limiting**: Gmail may rate limit if sending too many emails

### LINE Messages Not Received
1. **Channel Token**: Verify LINE Bot channel access token
2. **Webhook URL**: Ensure webhook is properly configured
3. **User ID**: Verify LINE user ID is correctly stored
4. **Bot Friendship**: User must be friends with the bot
5. **Message Format**: Check LINE message format compliance

### Database Issues
1. **Missing Records**: Check if notifications are being created
2. **User Preferences**: Verify user notification preferences
3. **Foreign Keys**: Ensure related entities (users, stories) exist

## Performance Testing

### Bulk Notification Test
```bash
# Test sending notifications to many users
curl -X POST http://localhost:8080/api/admin/notifications/bulk \
  -H "Authorization: Bearer {admin_jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user1", "user2", "user3", ...],
    "title": "Bulk Test Notification",
    "message": "Testing bulk notification delivery"
  }'
```

### Monitor Performance
- Check application response times
- Monitor email queue processing
- Verify LINE API rate limits
- Check database performance under load

## Security Testing

### Test Authentication
- Verify JWT tokens are required for notification endpoints
- Test with expired/invalid tokens
- Ensure users can only manage their own notifications

### Test Input Validation
- Send malformed notification data
- Test XSS prevention in notification content
- Verify email address validation

## Automated Testing Scripts

Create test scripts to automate common scenarios:

```bash
#!/bin/bash
# test_notifications.sh

echo "Testing Follow Notification..."
curl -X POST http://localhost:8080/api/users/testuser2/follow \
  -H "Authorization: Bearer $TEST_TOKEN"

echo "Testing Story Like Notification..."
curl -X POST http://localhost:8080/api/stories/$TEST_STORY_ID/like \
  -H "Authorization: Bearer $TEST_TOKEN"

echo "Testing Comment Notification..."
curl -X POST http://localhost:8080/api/stories/$TEST_STORY_ID/comments \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test comment for notification"}'

echo "All tests completed. Check email and LINE for notifications."
```

This comprehensive testing guide should help you manually verify that both Gmail and LINE notifications are working correctly in your application.