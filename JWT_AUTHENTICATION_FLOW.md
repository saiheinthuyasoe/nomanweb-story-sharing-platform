# 🔐 JWT Authentication Flow - Production Implementation

This document describes the complete production-ready JWT authentication flow with access and refresh tokens for the Nomanweb application.

## 📋 Overview

The authentication system implements a secure JWT authentication flow with the following features:

1. **Login** → Server returns `access_token` (15 min) + `refresh_token` (7 days)
2. **API Requests** → Use `access_token` in Authorization header
3. **Token Expired** → Automatic refresh using `refresh_token`
4. **Refresh Token Rotation** → New `refresh_token` issued on each use
5. **Real-time Monitoring** → Token status displayed in UI
6. **Secure Cookies** → Tokens stored in httpOnly, secure cookies
7. **Logout** → Refresh token revoked in database

## 🏗️ Architecture

### Backend Components

#### 1. RefreshToken Entity
```java
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
    private UUID id;
    private String token;           // JWT refresh token
    private User user;              // Associated user
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private boolean revoked;        // For token invalidation
    private LocalDateTime revokedAt;
    private String revokedByIp;     // Audit trail
    private String revokedByUserAgent;
}
```

#### 2. RefreshTokenService
- **createRefreshToken()** - Creates new refresh token
- **createRefreshTokenForLogin()** - Creates token and revokes old ones
- **validateRefreshToken()** - Validates JWT structure and database record
- **rotateRefreshToken()** - Revokes old token, creates new one
- **revokeRefreshToken()** - Marks token as revoked
- **cleanupExpiredTokens()** - Removes expired tokens

#### 3. JwtUtil Enhanced
- **generateToken()** - Creates access token (15 min)
- **generateRefreshToken()** - Creates refresh token (7 days)
- **validateToken()** - Validates access token
- **validateRefreshToken()** - Validates refresh token
- **getUserIdFromToken()** - Extracts user ID from token
- **getUserIdFromRefreshToken()** - Extracts user ID from refresh token

#### 4. AuthService
- **login()** - Creates access token + refresh token
- **refreshToken()** - Rotates refresh token, returns new access token
- **logout()** - Revokes refresh token

#### 5. AuthController Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

#### 6. Scheduled Cleanup
- Runs every hour to remove expired refresh tokens
- Prevents database bloat

### Frontend Components

#### 1. API Client with Interceptors
- **Request Interceptor** - Adds Bearer token to requests
- **Response Interceptor** - Handles 401 errors and automatic refresh
- **Retry Logic** - Retries failed requests after token refresh
- **Token Rotation** - Updates cookies with new tokens

#### 2. AuthContext
- **login()** - Handles login and token storage
- **logout()** - Handles logout and token cleanup
- **setAuthData()** - Sets authentication data in cookies
- **refreshUser()** - Refreshes user data

#### 3. useTokenRefresh Hook
- **checkTokenExpiration()** - Checks if token is expired
- **hasValidTokens()** - Checks if user has valid tokens
- **clearTokens()** - Clears all tokens

#### 4. TokenMonitor Component
- **Real-time Display** - Shows token status in real-time
- **Manual Refresh** - Allows manual token refresh
- **Token Inspection** - Shows token expiration times
- **Visual Indicators** - Color-coded status indicators

## 🔧 Configuration

### Backend Configuration (application.properties)
```properties
# JWT Configuration
app.jwt.secret=${APP_JWT_SECRET:your-256-bit-secret-key-here-make-it-very-long-and-secure-for-production}
app.jwt.expiration=${APP_JWT_EXPIRATION:900000}      # 15 minutes
app.jwt.refresh-expiration=${APP_JWT_REFRESH_EXPIRATION:604800000}  # 7 days
```

### Frontend Configuration
```typescript
// Cookie settings for production
const cookieOptions = {
  expires: 7,
  path: '/',
  secure: true,       // HTTPS only
  sameSite: 'strict'  // CSRF protection
};
```

## 🔄 Token Flow

### 1. Login Flow
```
User → Login Request → AuthService
                   ↓
            Generate Access Token (15 min)
                   ↓
            Generate Refresh Token (7 days)
                   ↓
            Store in Database
                   ↓
            Return to Client
                   ↓
            Store in Secure Cookies
```

### 2. API Request Flow
```
Client → API Request → Check Access Token
                   ↓
            Token Valid? → Continue Request
                   ↓
            Token Expired? → Automatic Refresh
                   ↓
            Refresh Token Valid? → Generate New Tokens
                   ↓
            Retry Original Request
```

### 3. Token Refresh Flow
```
Client → Refresh Request → Validate Refresh Token
                       ↓
                Check Database Record
                       ↓
                Generate New Access Token
                       ↓
                Rotate Refresh Token
                       ↓
                Revoke Old Refresh Token
                       ↓
                Return New Tokens
```

### 4. Logout Flow
```
Client → Logout Request → Revoke Refresh Token
                      ↓
                Clear Client Cookies
                      ↓
                Redirect to Login
```

## 🛡️ Security Features

### 1. Token Security
- **Short Access Token Expiry** - 15 minutes reduces exposure
- **Long Refresh Token Expiry** - 7 days for user convenience
- **Token Rotation** - New refresh token on each use
- **Database Validation** - Refresh tokens validated against database

### 2. Audit Trail
- **IP Address Tracking** - Records IP for token operations
- **User Agent Tracking** - Records browser/device info
- **Revocation Timestamps** - Tracks when tokens were revoked
- **Cleanup Logging** - Logs token cleanup operations

### 3. Rate Limiting
- **Login Attempts** - Limited login attempts per IP
- **Refresh Attempts** - Prevents refresh token abuse
- **Password Reset** - Limited password reset attempts

### 4. Cookie Security
- **HttpOnly** - Prevents JavaScript access
- **Secure** - HTTPS only transmission
- **SameSite** - CSRF protection
- **Path Restriction** - Limited to specific paths

## 🧪 Testing

### Test JWT Flow Page
- **Token Inspection** - View token details and expiration
- **API Testing** - Test protected endpoints
- **Refresh Testing** - Test manual and automatic refresh
- **Logout Testing** - Test token revocation
- **Real-time Monitor** - Visual token status display

### Test Scenarios
1. **Normal Login** - User logs in and receives tokens
2. **Token Refresh** - Access token expires and refreshes automatically
3. **Token Rotation** - Refresh token is rotated on use
4. **Logout** - Tokens are properly revoked
5. **Concurrent Requests** - Multiple requests during refresh
6. **Expired Refresh Token** - Proper handling of expired refresh tokens

## 📊 Monitoring

### Real-time Monitoring
- **Token Status Display** - Shows current token status
- **Expiration Countdown** - Real-time countdown to expiration
- **Refresh Indicators** - Visual indicators for refresh events
- **Error Logging** - Comprehensive error logging

### Database Monitoring
- **Active Tokens** - Count of active refresh tokens per user
- **Expired Tokens** - Automatic cleanup of expired tokens
- **Revoked Tokens** - Tracking of revoked tokens
- **Cleanup Statistics** - Logs of cleanup operations

## 🚀 Production Deployment

### Environment Variables
```bash
# JWT Configuration
APP_JWT_SECRET=your-production-secret-key-256-bits-minimum
APP_JWT_EXPIRATION=900000                    # 15 minutes
APP_JWT_REFRESH_EXPIRATION=604800000         # 7 days

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/nomanweb
SPRING_DATASOURCE_USERNAME=your_username
SPRING_DATASOURCE_PASSWORD=your_password

# CORS Configuration
APP_CORS_ALLOWED_ORIGINS=https://yourdomain.com
APP_CORS_ALLOW_CREDENTIALS=true
```

### Database Migration
```sql
-- Run refresh_tokens_migration.sql
-- Creates refresh_tokens table with proper indexes
-- Adds foreign key constraints
-- Creates audit trail columns
```

### Frontend Build
```bash
# Build for production
npm run build

# Environment variables
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

## 🔍 Troubleshooting

### Common Issues

1. **Token Refresh Loops**
   - Check token expiration times
   - Verify refresh token rotation
   - Check for clock synchronization

2. **CORS Issues**
   - Verify allowed origins
   - Check credentials flag
   - Ensure proper headers

3. **Database Errors**
   - Check foreign key constraints
   - Verify table creation
   - Check connection settings

4. **Cookie Issues**
   - Verify domain settings
   - Check secure flag for HTTPS
   - Ensure SameSite compatibility

### Debug Features
- **Token Monitor** - Real-time token inspection
- **Console Logging** - Detailed operation logs
- **Test Pages** - Comprehensive testing tools
- **Error Handling** - Graceful error recovery

## 📈 Performance Considerations

### Optimizations
- **Token Caching** - Redis caching for validation
- **Database Indexes** - Proper indexing for performance
- **Connection Pooling** - Efficient database connections
- **Cleanup Scheduling** - Regular cleanup to prevent bloat

### Scalability
- **Horizontal Scaling** - Stateless token validation
- **Load Balancing** - Session-independent design
- **Caching Strategy** - Redis for token validation
- **Database Sharding** - User-based partitioning

## 📋 Maintenance

### Regular Tasks
- **Token Cleanup** - Automated every hour
- **Log Rotation** - Prevent log file bloat
- **Security Updates** - Regular dependency updates
- **Performance Monitoring** - Track token operations

### Monitoring Metrics
- **Token Generation Rate** - Monitor login frequency
- **Refresh Rate** - Monitor token refresh frequency
- **Error Rate** - Monitor authentication errors
- **Database Growth** - Monitor token table size

This implementation provides a robust, secure, and production-ready JWT authentication system with comprehensive monitoring and testing capabilities. 