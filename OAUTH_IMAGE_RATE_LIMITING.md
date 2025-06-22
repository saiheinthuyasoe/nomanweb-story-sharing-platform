# OAuth Image Rate Limiting System

## Overview

Your application handles profile images from various OAuth providers (Google, LINE, Facebook). These providers implement rate limiting to prevent abuse, which can cause temporary image loading failures. This document explains how the system handles these limitations gracefully.

## How It Works

### 1. Rate Limiting Detection
The system automatically detects OAuth provider images by checking URLs for:
- `googleusercontent.com` (Google profile images)
- `profile-cdn.line-scdn.net` (LINE profile images)  
- `graph.facebook.com` (Facebook profile images)

### 2. Conservative Request Limits
- **Maximum requests per minute**: 3 (very conservative to avoid rate limits)
- **Cooldown period**: 5 minutes when rate limit is reached
- **Request tracking**: System tracks requests per domain over the last minute

### 3. Error Handling Strategy
- **Silent logging**: OAuth errors are logged only once per domain per session to reduce console noise
- **Graceful degradation**: Shows user-friendly error messages instead of technical errors
- **Visual indicators**: Yellow indicator dot shows when OAuth rate limiting is active
- **Fallback UI**: Default avatar icon shown when OAuth images fail

## User Experience

### What Users See
1. **Loading state**: Spinner while image loads
2. **Success state**: Image displays normally  
3. **Rate limit state**: 
   - Default user avatar with yellow indicator
   - Message: "Social media image temporarily unavailable"
   - Suggestion: "Provider rate limit active - please wait a few minutes"
   - Option to upload a new image instead

### User Actions
- **Upload new image**: Users can replace OAuth images with uploaded files
- **Wait and retry**: System automatically retries after cooldown period
- **Remove image**: Option to remove the problematic image

## Developer Tools

### Browser Console Commands (Development Mode Only)
```javascript
// Check current OAuth status
getOAuthStatus()

// Reset all OAuth cooldowns and errors (useful for testing)
resetOAuthStatus()

// Clear all image cache including OAuth data
clearImageCache()
```

### OAuth Status Information
The `getOAuthStatus()` command shows:
- **Cooldowns**: Which domains are in cooldown and when they expire
- **Recent requests**: Request count per domain in the last minute
- **Cache size**: Number of cached images
- **Silent error keys**: Which error types have been silenced

## Technical Implementation

### Rate Limiting Logic
```typescript
// Check if domain is in cooldown
const cooldownEnd = OAUTH_GLOBAL_COOLDOWN.get(domain) || 0;
if (now < cooldownEnd) {
  // Skip request, return cached error
}

// Check recent request count
const recentRequests = requests.filter(time => now - time < 60000);
if (recentRequests.length >= OAUTH_MAX_REQUESTS_PER_MINUTE) {
  // Activate 5-minute cooldown
  OAUTH_GLOBAL_COOLDOWN.set(domain, now + 5 * 60 * 1000);
}
```

### Caching Strategy
- **Success cache**: 5 minutes for successful loads
- **Failed cache**: 30 seconds for regular failures
- **OAuth failed cache**: 2 minutes for OAuth failures (longer to prevent rate limiting)

### Silent Error System
Prevents console spam by logging each error type only once per domain per session:
- Initial rate limit warnings
- Cooldown period messages  
- Timeout notifications

## Best Practices

### For Users
1. **Upload profile images directly** instead of relying on OAuth provider images
2. **Wait for cooldown periods** before attempting to reload OAuth images
3. **Use the "Upload new image" option** when OAuth images are rate limited

### For Developers
1. **Monitor OAuth status** using browser console commands during development
2. **Test rate limiting** by calling `resetOAuthStatus()` and making multiple requests
3. **Check for new OAuth providers** and update the `isOAuthImage()` function if needed

## Troubleshooting

### Common Issues

#### "OAuth provider rate limited - 5 minute cooldown activated"
- **Cause**: Too many requests to the same OAuth provider domain
- **Solution**: Wait 5 minutes or upload a new image
- **Prevention**: System automatically prevents this with conservative limits

#### Images not loading after OAuth login
- **Cause**: OAuth provider images may have temporary access restrictions
- **Solution**: System will retry automatically, or user can upload new image
- **Check**: Use `getOAuthStatus()` to see current cooldown status

#### Console errors about image loading
- **Cause**: OAuth provider rate limiting (this is normal behavior)
- **Solution**: Errors are now silenced for OAuth images to reduce noise
- **Note**: Only non-OAuth image errors are logged to console

### Recovery Steps
1. Check OAuth status: `getOAuthStatus()`
2. If in cooldown, wait for expiration or reset: `resetOAuthStatus()`
3. Clear all caches if needed: `clearImageCache()`
4. Refresh the page to restart image loading

## Configuration

### Adjustable Parameters
```typescript
// In imageLoader.ts
const OAUTH_MAX_REQUESTS_PER_MINUTE = 3; // Conservative limit
const OAUTH_FAILED_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
// Cooldown period is fixed at 5 minutes
```

### Adding New OAuth Providers
Update the `isOAuthImage()` function:
```typescript
const isOAuthImage = (url: string): boolean => {
  return url.includes('googleusercontent.com') || 
         url.includes('profile-cdn.line-scdn.net') ||
         url.includes('graph.facebook.com') ||
         url.includes('your-new-provider.com'); // Add new provider
};
```

## Monitoring

### Metrics to Watch
- **Cooldown frequency**: How often domains enter cooldown
- **Cache hit rates**: Percentage of images served from cache
- **User fallback usage**: How often users upload new images due to OAuth failures

### Logs to Monitor
- OAuth rate limiting activations
- Cooldown period durations
- User interactions with fallback UI

## Future Improvements

### Potential Enhancements
1. **Exponential backoff**: Increase cooldown periods for repeated violations
2. **Provider-specific limits**: Different limits for different OAuth providers
3. **User preferences**: Allow users to opt out of OAuth image loading
4. **Background refresh**: Attempt to refresh OAuth images during off-peak times
5. **Analytics**: Track OAuth provider reliability and adjust limits accordingly

This system ensures a smooth user experience while respecting OAuth provider rate limits and maintaining application performance. 