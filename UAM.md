# 🔐 User Authentication and Management - Complete File Structure & Implementation

## 📋 **Backend Implementation (Spring Boot)**

### **1. Core Entity Files**

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/entity/User.java`**
- **Purpose**: Main user entity with all authentication-related fields
- **Key Features**: 
  - UUID-based ID generation
  - Email/username uniqueness constraints
  - Role-based access control (USER/ADMIN)
  - Account status management (ACTIVE/SUSPENDED/BANNED)
  - OAuth integration fields (Google ID, LINE User ID)
  - Email verification status
  - Password reset functionality
  - Coin balance and earnings tracking

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/entity/RefreshToken.java`**
- **Purpose**: Manages JWT refresh tokens for secure session management
- **Key Features**:
  - Token expiration handling
  - Revocation capability
  - User association
  - Automatic cleanup of expired tokens

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/entity/EmailVerificationToken.java`**
- **Purpose**: Handles email verification during registration
- **Key Features**:
  - Time-limited verification tokens
  - User association
  - One-time use validation

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/entity/EmailChangeToken.java`**
- **Purpose**: Manages email change verification process
- **Key Features**:
  - Secure email change workflow
  - Token expiration
  - User verification

### **2. Data Transfer Objects (DTOs)**

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/dto/auth/`**
- **`LoginRequest.java`**: Email/password login credentials
- **`LoginResponse.java`**: Authentication response with user data and tokens
- **`RegisterRequest.java`**: User registration data validation
- **`OAuthEmailChangeRequest.java`**: OAuth user email change
- **`OAuthUsernameChangeRequest.java`**: OAuth user username change
- **`EmailChangeRequest.java`**: Standard user email change
- **`UsernameChangeRequest.java`**: Standard user username change

### **3. Service Layer**

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/service/AuthService.java`**
- **Purpose**: Core authentication business logic
- **Key Features**:
  - User login with password validation
  - User registration with email verification
  - Email verification handling
  - Password change functionality
  - Profile update management
  - Account status validation

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/service/AdminAuthService.java`**
- **Purpose**: Admin-specific authentication and management
- **Key Features**:
  - Admin login with enhanced security
  - User promotion/demotion to admin
  - Admin activity logging
  - Admin user validation

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/service/impl/AdminAuthServiceImpl.java`**
- **Purpose**: Implementation of admin authentication service
- **Key Features**:
  - Secure admin login validation
  - User role management
  - Security logging and monitoring

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/service/CachedAuthService.java`**
- **Purpose**: Caching layer for authentication data
- **Key Features**:
  - Redis-based user profile caching
  - Cache invalidation on updates
  - Performance optimization

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/service/impl/OAuthServiceImpl.java`**
- **Purpose**: OAuth integration (Google & LINE)
- **Key Features**:
  - Google OAuth authentication
  - LINE OAuth authentication
  - Profile image handling
  - Account linking

### **4. Repository Layer**

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/repository/UserRepository.java`**
- **Purpose**: Database operations for user management
- **Key Features**:
  - User CRUD operations
  - Email/username uniqueness checks
  - OAuth user lookup
  - Active user queries
  - Password reset token handling

### **5. Controller Layer**

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/controller/AuthController.java`**
- **Purpose**: REST API endpoints for authentication
- **Key Features**:
  - Login/register endpoints
  - Token refresh/logout
  - Rate limiting integration
  - CORS configuration
  - Error handling

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/controller/AdminAuthController.java`**
- **Purpose**: Admin-specific API endpoints
- **Key Features**:
  - Admin login endpoint
  - User promotion/demotion
  - Admin-only operations
  - Security headers

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/controller/UserController.java`**
- **Purpose**: User profile and management endpoints
- **Key Features**:
  - Profile management
  - User search and discovery
  - Follow/unfollow functionality

### **6. Configuration & Security**

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/config/SecurityConfig.java`**
- **Purpose**: Spring Security configuration
- **Key Features**:
  - JWT authentication setup
  - Endpoint authorization rules
  - CORS configuration
  - Password encoder setup
  - Session management

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/config/JwtAuthenticationFilter.java`**
- **Purpose**: JWT token validation middleware
- **Key Features**:
  - Token extraction and validation
  - User authentication context
  - Security context management
  - Error handling

### **7. Utility Classes**

**📍 `nomanweb_backend/src/main/java/com/app/nomanweb_backend/util/JwtUtil.java`**
- **Purpose**: JWT token generation and validation
- **Key Features**:
  - Token generation with claims
  - Token validation
  - User information extraction
  - Expiration handling

---

## 🎨 **Frontend Implementation (Next.js)**

### **1. Context & State Management**

**�� `nomanweb_frontend/src/contexts/AuthContext.tsx`**
- **Purpose**: Global authentication state management
- **Key Features**:
  - User state management
  - Login/logout functionality
  - Token management
  - Automatic authentication checks
  - Token refresh handling

### **2. API Integration**

**�� `nomanweb_frontend/src/lib/api/auth.ts`**
- **Purpose**: Authentication API client
- **Key Features**:
  - Login/register API calls
  - Token refresh
  - OAuth integration
  - Profile management
  - Password reset functionality

**�� `nomanweb_frontend/src/lib/api/client.ts`**
- **Purpose**: Base API client configuration
- **Key Features**:
  - Axios configuration
  - Token injection
  - Error handling
  - Request/response interceptors

### **3. Authentication Pages**

**�� `nomanweb_frontend/src/app/login/page.tsx`**
- **Purpose**: User login interface
- **Key Features**:
  - Email/password login form
  - OAuth integration buttons
  - Remember me functionality
  - Form validation
  - Error handling

**�� `nomanweb_frontend/src/app/register/page.tsx`**
- **Purpose**: User registration interface
- **Key Features**:
  - Registration form with validation
  - Password confirmation
  - Terms acceptance
  - Email verification flow

**�� `nomanweb_frontend/src/app/admin/login/page.tsx`**
- **Purpose**: Admin-specific login interface
- **Key Features**:
  - Admin authentication
  - Enhanced security measures
  - Admin code validation

### **4. Email Verification Pages**

**�� `nomanweb_frontend/src/app/verify-email/page.tsx`**
- **Purpose**: Email verification handling
- **Key Features**:
  - Token validation
  - Success/error states
  - Automatic redirects

**�� `nomanweb_frontend/src/app/verify-email-pending/page.tsx`**
- **Purpose**: Pending email verification status
- **Key Features**:
  - Verification status display
  - Resend verification option
  - User guidance

### **5. OAuth Components**

**�� `nomanweb_frontend/src/components/auth/GoogleSignIn.tsx`**
- **Purpose**: Google OAuth integration
- **Key Features**:
  - Google Sign-In button
  - Token handling
  - Error management

**�� `nomanweb_frontend/src/components/auth/LineSignIn.tsx`**
- **Purpose**: LINE OAuth integration
- **Key Features**:
  - LINE Login button
  - Access token handling
  - Callback management

### **6. API Routes**

**�� `nomanweb_frontend/src/app/api/admin/auth/login/route.ts`**
- **Purpose**: Admin authentication proxy
- **Key Features**:
  - Backend communication
  - Security logging
  - Error handling

**�� `nomanweb_frontend/src/app/api/liveblocks-auth/route.ts`**
- **Purpose**: Liveblocks authentication integration
- **Key Features**:
  - Real-time collaboration auth
  - JWT validation
  - Room access control

### **7. Type Definitions**

**�� `nomanweb_frontend/src/types/user.ts`**
- **Purpose**: TypeScript type definitions
- **Key Features**:
  - User interface definition
  - Authentication response types
  - OAuth user properties

### **8. Firebase Integration**

**�� `nomanweb_frontend/src/lib/firebase.ts`**
- **Purpose**: Firebase configuration for Google OAuth
- **Key Features**:
  - Firebase app initialization
  - Google Auth provider setup
  - Environment variable integration

---

## 🔄 **Authentication Flow Summary**

### **1. User Registration Flow**
```
User Input → Frontend Validation → API Call → Backend Validation → 
User Creation → Email Verification Token → Email Service → 
User Verification → Account Activation
```

### **2. User Login Flow**
```
User Credentials → Frontend Validation → API Call → Backend Validation → 
Password Verification → Account Status Check → JWT Generation → 
Token Storage → Dashboard Redirect
```

### **3. OAuth Flow**
```
OAuth Button → Provider Authentication → Callback → Backend Verification → 
User Creation/Linking → Token Generation → Success Response
```

### **4. Token Refresh Flow**
```
API Request → Token Expired → Automatic Refresh → New Access Token → 
Request Retry → Success Response
```

This comprehensive authentication system provides secure, scalable user management with OAuth integration, email verification, and role-based access control for both regular users and administrators.