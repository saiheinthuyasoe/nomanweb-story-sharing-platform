# IP Tracking Verification Guide

## Overview
This guide helps you verify that IP tracking for security (rate limiting, logging, etc.) is working correctly in the NoManWeb application.

## Current IP Tracking Implementation

### 1. IP Address Extraction Logic
The application uses a consistent IP extraction method across all controllers:

```java
private String getClientIp(HttpServletRequest request) {
    String xForwardedFor = request.getHeader("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
        return xForwardedFor.split(",")[0].trim();
    }

    String xRealIp = request.getHeader("X-Real-IP");
    if (xRealIp != null && !xRealIp.isEmpty()) {
        return xRealIp;
    }

    return request.getRemoteAddr();
}
```

### 2. Rate Limiting Configuration
- **Login**: 5 attempts per minute per IP
- **Register**: 5 attempts per hour per IP  
- **Password Reset**: 3 attempts per hour per IP
- **Email Verification**: 3 attempts per hour per IP (uses password reset limit)
- **Email Change**: 3 attempts per hour per IP (regular users)
- **OAuth Email Change**: 3 attempts per hour per IP (OAuth users)
- **Username Change**: 3 attempts per hour per IP (regular users)
- **OAuth Username Change**: 3 attempts per hour per IP (OAuth users)
- **Email Verification Resend**: 3 attempts per hour per IP (uses password reset limit)
- **Email Change Verification Resend**: 3 attempts per hour per IP (uses email change limit)

### 3. Frontend Cooldown Configuration
- **Email Verification Resend**: 60-second cooldown timer
- **Email Change Verification Resend**: 60-second cooldown timer
- **Password Reset**: 60-second cooldown timer

## Testing Methods

### Method 1: Log Analysis

#### 1.1 Monitor Application Logs
```bash
# Tail the application logs to see IP tracking in action
tail -f nomanweb_backend/logs/nomanweb_backend-logger-*.log | grep -E "(Rate limit|IP|login|register|password)"
```

#### 1.2 Expected Log Patterns
Look for these log entries:

**Rate Limiting:**
```
WARN c.a.n.s.RateLimitService - Rate limit exceeded for key: 192.168.1.100 and type: LOGIN
```

**Authentication Attempts:**
```
INFO c.a.n.s.AuthService - User john@example.com logged in successfully
INFO c.a.n.s.AuthService - Password reset email sent to: john@example.com from IP: 192.168.1.100
WARN c.a.n.s.AuthService - Password reset attempt failed for email: invalid@example.com from IP: 192.168.1.100
```

### Method 2: Manual Testing

#### 2.1 Test Rate Limiting
```bash
# Test login rate limiting (should fail after 5 attempts in 1 minute)
for i in {1..10}; do
  curl -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}' \
    -w "Attempt $i: %{http_code}\n"
  sleep 2
done

# Test OAuth email change rate limiting (should fail after 3 attempts in 1 hour)
for i in {1..5}; do
  curl -X POST http://localhost:8080/api/auth/change-email-oauth \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{"newEmail":"newemail@example.com"}' \
    -w "Attempt $i: %{http_code}\n"
  sleep 1
done

# Test username change rate limiting (should fail after 3 attempts in 1 hour)
for i in {1..5}; do
  curl -X POST http://localhost:8080/api/auth/change-username \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{"currentPassword":"password123","newUsername":"newusername"}' \
    -w "Attempt $i: %{http_code}\n"
  sleep 1
done

# Test OAuth username change rate limiting (should fail after 3 attempts in 1 hour)
for i in {1..5}; do
  curl -X POST http://localhost:8080/api/auth/change-username-oauth \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{"newUsername":"oauthnewusername"}' \
    -w "Attempt $i: %{http_code}\n"
  sleep 1
done
```

#### 2.2 Test Different IP Headers
```bash
# Test X-Forwarded-For header
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 203.0.113.1" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'

# Test X-Real-IP header
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Real-IP: 198.51.100.1" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'
```

### Method 3: Frontend Testing

#### 3.1 Browser Developer Tools
1. Open browser developer tools (F12)
2. Go to Network tab
3. Attempt login/register/password reset
4. Check request headers for IP information
5. Check response status codes (429 for rate limiting)

#### 3.2 Test Rate Limiting UI
1. Rapidly click login/register buttons
2. Verify toast notifications appear for rate limiting
3. Check if buttons are disabled during cooldown

#### 3.3 Test Email Verification Cooldowns
1. Go to `/resend-verification` page
2. Submit email verification request
3. Verify 60-second cooldown timer starts
4. Check that button is disabled and shows countdown
5. Try clicking button during cooldown - should show error message
6. Wait for cooldown to expire and verify button becomes enabled

#### 3.4 Test Email Change Verification Cooldowns
1. Go to profile page and open email change modal
2. Submit email change request
3. In the verification pending step, click "Resend Verification Email"
4. Verify 60-second cooldown timer starts
5. Check that button is disabled and shows countdown
6. Try clicking button during cooldown - should show error message
7. Wait for cooldown to expire and verify button becomes enabled

### Method 4: Database Verification (if applicable)

#### 4.1 Check Log Tables
```sql
-- If you have audit logs, check for IP tracking
SELECT * FROM audit_logs WHERE ip_address IS NOT NULL ORDER BY created_at DESC LIMIT 10;

-- Check for rate limiting events
SELECT * FROM security_events WHERE event_type LIKE '%rate_limit%' ORDER BY created_at DESC LIMIT 10;
```

## Verification Checklist

### ✅ Rate Limiting Verification
- [ ] Login attempts are limited to 5 per minute per IP
- [ ] Registration attempts are limited to 5 per hour per IP
- [ ] Password reset attempts are limited to 3 per hour per IP
- [ ] Email change attempts are limited to 3 per hour per IP (regular users)
- [ ] OAuth email change attempts are limited to 3 per hour per IP (OAuth users)
- [ ] Username change attempts are limited to 3 per hour per IP (regular users)
- [ ] OAuth username change attempts are limited to 3 per hour per IP (OAuth users)
- [ ] Email verification resend attempts are limited to 3 per hour per IP
- [ ] Email change verification resend attempts are limited to 3 per hour per IP
- [ ] HTTP 429 status codes are returned when limits exceeded
- [ ] Frontend shows appropriate error messages

### ✅ Frontend Cooldown Verification
- [ ] Email verification resend has 60-second cooldown timer
- [ ] Email change verification resend has 60-second cooldown timer
- [ ] Password reset has 60-second cooldown timer
- [ ] Cooldown timers show countdown and disable buttons
- [ ] Cooldown state persists across page refreshes

### ✅ IP Address Extraction
- [ ] X-Forwarded-For header is properly parsed
- [ ] X-Real-IP header is properly parsed
- [ ] Fallback to request.getRemoteAddr() works
- [ ] Multiple IPs in X-Forwarded-For are handled correctly (first IP used)

### ✅ Logging Verification
- [ ] IP addresses are logged in authentication attempts
- [ ] Rate limiting events are logged with IP information
- [ ] Failed attempts include IP addresses
- [ ] Successful attempts include IP addresses

### ✅ Security Headers
- [ ] Frontend properly forwards IP headers to backend
- [ ] Backend correctly extracts IP from various header sources
- [ ] IP information is used consistently across all auth endpoints

## Common Issues and Solutions

### Issue 1: IP Shows as "0:0:0:0:0:0:0:1" or "127.0.0.1"
**Cause**: Testing from localhost
**Solution**: 
- Test from a different machine/network
- Use proxy tools to simulate different IPs
- Check if running behind a reverse proxy

### Issue 2: Rate Limiting Not Working
**Possible Causes**:
- Bucket4j buckets not persisting
- IP extraction not working correctly
- Rate limit configuration issues

**Debugging**:
```bash
# Check if rate limiting is being triggered
grep "Rate limit exceeded" nomanweb_backend/logs/*.log

# Check IP extraction
grep "getClientIp" nomanweb_backend/logs/*.log
```

### Issue 3: Frontend Not Showing Rate Limit Messages
**Check**:
- Network tab for 429 responses
- Console for error handling
- Toast notification implementation

## Monitoring Tools

### 1. Real-time Monitoring Script
```bash
#!/bin/bash
# monitor_ip_tracking.sh
while true; do
  echo "=== $(date) ==="
  tail -n 20 nomanweb_backend/logs/nomanweb_backend-logger-*.log | grep -E "(IP|Rate limit|login|register)" | tail -5
  sleep 10
done
```

### 2. Rate Limit Testing Script
```bash
#!/bin/bash
# test_rate_limits.sh
echo "Testing login rate limiting..."
for i in {1..10}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}')
  echo "Attempt $i: HTTP $response"
  if [ "$response" = "429" ]; then
    echo "Rate limiting working correctly!"
    break
  fi
  sleep 1
done
```

## Security Considerations

### 1. IP Spoofing Protection
- The current implementation trusts X-Forwarded-For and X-Real-IP headers
- In production, ensure these headers are only set by trusted proxies
- Consider implementing additional validation for IP ranges

### 2. IPv6 Support
- Current implementation supports IPv6 addresses
- Test with both IPv4 and IPv6 addresses

### 3. Proxy Configuration
- If behind a reverse proxy, ensure proper header forwarding
- Configure proxy to set X-Forwarded-For correctly

## Production Deployment Verification

### 1. Load Balancer Configuration
```nginx
# Nginx configuration example
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

### 2. Cloud Provider Considerations
- AWS: Use X-Forwarded-For from ALB/ELB
- GCP: Use X-Forwarded-For from Load Balancer
- Azure: Use X-Forwarded-For from Application Gateway

### 3. Monitoring and Alerting
- Set up alerts for unusual rate limiting patterns
- Monitor for potential DDoS attacks
- Track authentication failure rates by IP

## Conclusion

Regular testing of IP tracking ensures that:
1. Rate limiting effectively prevents brute force attacks
2. Security logs provide accurate IP information for incident response
3. The system can handle various network configurations
4. Frontend properly communicates rate limiting to users

Run these tests regularly, especially after deployments or configuration changes. 