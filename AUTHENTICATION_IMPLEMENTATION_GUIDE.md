# NoManWeb Authentication Implementation Guide

## Overview

This document provides a comprehensive overview of the authentication system implemented in the NoManWeb story platform, covering both backend (Spring Boot) and frontend (Next.js) implementations.

## Table of Contents

1. [Backend Authentication Implementation](#backend-authentication-implementation)
2. [Frontend Authentication Implementation](#frontend-authentication-implementation)
3. [Database Schema](#database-schema)
4. [OAuth Integration](#oauth-integration)
5. [Security Features](#security-features)
6. [API Endpoints](#api-endpoints)
7. [Step-by-Step Implementation Guide](#step-by-step-implementation-guide)

---

## Backend Authentication Implementation

### 1. Core Components

#### JWT Utility (`JwtUtil.java`)
- **Location**: `nomanweb_backend/src/main/java/com/app/nomanweb_backend/util/JwtUtil.java`
- **Purpose**: Handles JWT token generation, validation, and extraction
- **Key Features**:
  - Token generation with user ID, email, and role
  - Refresh token generation
  - Token validation and parsing
  - Configurable expiration times

#### Authentication Filter (`JwtAuthenticationFilter.java`)
- **Location**: `nomanweb_backend/src/main/java/com/app/nomanweb_backend/config/JwtAuthenticationFilter.java`
- **Purpose**: Intercepts HTTP requests to validate JWT tokens
- **Key Features**:
  - Bearer token extraction from Authorization header
  - Token validation and user authentication
  - Security context population
  - User existence verification

#### Security Configuration (`SecurityConfig.java`)
- **Location**: `nomanweb_backend/src/main/java/com/app/nomanweb_backend/config/SecurityConfig.java`
- **Purpose**: Configures Spring Security settings
- **Key Features**:
  - CORS configuration for frontend integration
  - Public and protected endpoint definitions
  - JWT filter integration
  - Password encoder configuration (BCrypt)

### 2. Authentication Service (`AuthService.java`)
- **Location**: `nomanweb_backend/src/main/java/com/app/nomanweb_backend/service/AuthService.java`
- **Key Methods**:
  - `login()`: User authentication with email/password
  - `register()`: User registration with email verification
  - `forgotPassword()`: Password reset token generation
  - `resetPassword()`: Password reset with token validation
  - `verifyEmail()`: Email verification process
  - `refreshToken()`: JWT token refresh
  - `changePassword()`: Password change for authenticated users

### 3. Authentication Controller (`AuthController.java`)
- **Location**: `nomanweb_backend/src/main/java/com/app/nomanweb_backend/controller/AuthController.java`
- **Endpoints**:
  - `POST /api/auth/login`: User login
  - `POST /api/auth/register`: User registration
  - `GET /api/auth/profile`: Get user profile
  - `PUT /api/auth/profile`: Update user profile
  - `PUT /api/auth/change-password`: Change password
  - `POST /api/auth/forgot-password`: Request password reset
  - `POST /api/auth/reset-password`: Reset password with token
  - `POST /api/auth/verify-email`: Verify email address
  - `POST /api/auth/resend-verification`: Resend verification email
  - `POST /api/auth/refresh`: Refresh JWT token

---

## Frontend Authentication Implementation

### 1. Authentication Context (`AuthContext.tsx`)
- **Location**: `nomanweb_frontend/src/contexts/AuthContext.tsx`
- **Purpose**: Global state management for authentication
- **Key Features**:
  - User state management
  - Login/logout functionality
  - Registration handling
  - Token storage with cookies
  - Automatic authentication checking

### 2. API Client Configuration (`client.ts`)
- **Location**: `nomanweb_frontend/src/lib/api/client.ts`
- **Purpose**: HTTP client with authentication interceptors
- **Key Features**:
  - Automatic token attachment to requests
  - 401 error handling and redirect
  - Protected endpoint detection

### 3. Authentication API (`auth.ts`)
- **Location**: `nomanweb_frontend/src/lib/api/auth.ts`
- **Purpose**: API methods for authentication operations
- **Methods**:
  - `login()`: User login
  - `register()`: User registration
  - `getProfile()`: Fetch user profile
  - `updateProfile()`: Update user profile
  - `changePassword()`: Change password
  - `forgotPassword()`: Request password reset
  - `resetPassword()`: Reset password
  - `verifyEmail()`: Verify email
  - `resendVerification()`: Resend verification email

### 4. Authentication Pages

#### Login Page (`login/page.tsx`)
- **Location**: `nomanweb_frontend/src/app/login/page.tsx`
- **Features**:
  - Email/password login form
  - Form validation with react-hook-form
  - OAuth integration (Google & LINE)
  - Password visibility toggle
  - Remember me functionality
  - Forgot password link

#### Registration Page (`register/page.tsx`)
- **Location**: `nomanweb_frontend/src/app/register/page.tsx`
- **Features**:
  - User registration form
  - Email verification flow
  - Password strength validation
  - OAuth registration options

### 5. Route Protection
- **Implementation**: Client-side route protection in dashboard and protected pages
- **Method**: `useAuth` hook with redirect logic
- **Example**: Dashboard page checks authentication status and redirects to login if not authenticated

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    password_hash VARCHAR(255), -- NULL for OAuth users
    profile_image_url TEXT,
    bio TEXT,
    role ENUM('user', 'admin') DEFAULT 'user',
    status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
    coin_balance DECIMAL(10,2) DEFAULT 0.00,
    total_earned_coins DECIMAL(10,2) DEFAULT 0.00,
    line_user_id VARCHAR(100), -- For LINE integration
    google_id VARCHAR(100), -- For Google OAuth
    email_verified BOOLEAN DEFAULT FALSE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP NULL,
    last_password_change TIMESTAMP NULL,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Email Verification Tokens Table
```sql
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Password Reset Attempts Table
```sql
CREATE TABLE password_reset_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    token_generated BOOLEAN DEFAULT FALSE,
    success BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## OAuth Integration

### 1. Google OAuth
- **Backend Service**: `OAuthService.java` and `OAuthServiceImpl.java`
- **Frontend Component**: `GoogleSignIn.tsx`
- **Flow**:
  1. Frontend initiates Google sign-in with Firebase
  2. Google returns ID token
  3. Frontend sends ID token to backend
  4. Backend verifies token with Firebase
  5. User created/authenticated and JWT returned

### 2. LINE OAuth
- **Backend Service**: `LineOAuthService.java`
- **Frontend Component**: `LineSignIn.tsx`
- **Flow**:
  1. Frontend redirects to LINE authorization
  2. LINE returns authorization code
  3. Backend exchanges code for access token
  4. Backend fetches user profile from LINE
  5. User created/authenticated and JWT returned

### 3. OAuth Controller (`OAuthController.java`)
- **Endpoints**:
  - `POST /api/oauth/google`: Google OAuth authentication
  - `POST /api/oauth/line`: LINE OAuth authentication
  - `POST /api/oauth/link-google`: Link Google account to existing user
  - `POST /api/oauth/link-line`: Link LINE account to existing user

---

## Security Features

### 1. Rate Limiting
- **Service**: `RateLimitService.java`
- **Applied to**:
  - Login attempts
  - Registration attempts
  - Password reset requests
  - Email verification requests

### 2. Password Security
- **Encoding**: BCrypt with Spring Security
- **Requirements**: Minimum 6 characters (configurable)
- **Reset**: Secure token-based password reset

### 3. Email Verification
- **Required**: For new registrations
- **Token**: UUID-based verification tokens
- **Expiration**: Configurable (default 48 hours)

### 4. JWT Security
- **Algorithm**: HMAC SHA-256
- **Expiration**: Configurable access and refresh tokens
- **Claims**: User ID, email, role
- **Validation**: Signature and expiration checking

---

## API Endpoints

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/register` | User registration | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |
| PUT | `/api/auth/change-password` | Change password | Yes |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password | No |
| POST | `/api/auth/verify-email` | Verify email | No |
| POST | `/api/auth/resend-verification` | Resend verification | No |
| POST | `/api/auth/refresh` | Refresh JWT token | No |

### OAuth Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/oauth/google` | Google OAuth login | No |
| POST | `/api/oauth/line` | LINE OAuth login | No |
| POST | `/api/oauth/link-google` | Link Google account | Yes |
| POST | `/api/oauth/link-line` | Link LINE account | Yes |

---

## Step-by-Step Implementation Guide

### Backend Implementation Steps

#### Step 1: Database Setup
1. Create MySQL database
2. Run the SQL schema from `story_platform_db_schema.sql`
3. Configure database connection in `application.properties`

#### Step 2: JWT Configuration
1. Configure JWT secret and expiration in `application.properties`:
   ```properties
   app.jwt.secret=your-secret-key
   app.jwt.expiration=86400000
   app.jwt.refresh-expiration=604800000
   ```

#### Step 3: Security Configuration
1. Implement `SecurityConfig.java` with CORS and endpoint security
2. Create `JwtAuthenticationFilter.java` for request interception
3. Configure password encoder (BCrypt)

#### Step 4: Authentication Services
1. Implement `AuthService.java` with all authentication methods
2. Create `JwtUtil.java` for token operations
3. Implement `RateLimitService.java` for security

#### Step 5: Controllers
1. Create `AuthController.java` with all authentication endpoints
2. Implement `OAuthController.java` for social login
3. Add proper error handling and validation

#### Step 6: OAuth Integration
1. Configure Firebase for Google OAuth
2. Implement LINE OAuth service
3. Create OAuth service implementations

### Frontend Implementation Steps

#### Step 1: Authentication Context
1. Create `AuthContext.tsx` for global state management
2. Implement authentication methods (login, register, logout)
3. Add automatic authentication checking

#### Step 2: API Client Setup
1. Configure `client.ts` with axios interceptors
2. Implement automatic token attachment
3. Add 401 error handling

#### Step 3: Authentication API
1. Create `auth.ts` with all API methods
2. Implement proper error handling
3. Add TypeScript interfaces

#### Step 4: Authentication Pages
1. Create login page with form validation
2. Implement registration page with email verification flow
3. Add OAuth components (Google & LINE)
4. Create email verification pages

#### Step 5: Route Protection
1. Implement client-side route protection
2. Add authentication checks to protected pages
3. Handle loading states and redirects

#### Step 6: OAuth Components
1. Create `GoogleSignIn.tsx` component
2. Implement `LineSignIn.tsx` component
3. Configure Firebase and LINE OAuth settings

### Configuration Files

#### Backend Configuration (`application.properties`)
```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/nomanweb
spring.datasource.username=your-username
spring.datasource.password=your-password

# JWT
app.jwt.secret=your-jwt-secret-key
app.jwt.expiration=86400000
app.jwt.refresh-expiration=604800000

# Email
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password

# OAuth
firebase.config.path=path/to/firebase-config.json
line.channel.id=your-line-channel-id
line.channel.secret=your-line-channel-secret
```

#### Frontend Configuration (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_LINE_CHANNEL_ID=your-line-channel-id
NEXT_PUBLIC_LINE_CALLBACK_URL=http://localhost:3000/auth/line/callback
```

## Testing the Implementation

### Backend Testing
1. Use Postman collection: `NoManWeb_API_Tests.postman_collection.json`
2. Test all authentication endpoints
3. Verify JWT token validation
4. Test OAuth flows

### Frontend Testing
1. Test user registration flow
2. Verify email verification process
3. Test login/logout functionality
4. Test OAuth integration
5. Verify route protection

## Security Considerations

1. **JWT Secret**: Use a strong, randomly generated secret key
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure CORS properly for your domain
4. **Rate Limiting**: Implement rate limiting for all authentication endpoints
5. **Input Validation**: Validate all user inputs on both frontend and backend
6. **Password Policy**: Implement strong password requirements
7. **Session Management**: Proper token expiration and refresh handling

## Conclusion

The NoManWeb authentication system provides a comprehensive, secure, and user-friendly authentication experience with support for traditional email/password login, OAuth integration (Google & LINE), email verification, password reset, and proper security measures including JWT tokens, rate limiting, and route protection. 