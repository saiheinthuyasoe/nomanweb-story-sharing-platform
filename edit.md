# senior-project-notes
Senior Project 1

## 🏗️ **Implementation Architecture**

### **Backend Stack (Spring Boot)**
- **Framework**: Spring Boot 3.5.0 with Spring Security
- **Database**: PostgreSQL with JPA/Hibernate
- **Caching**: Redis for session management and rate limiting
- **Authentication**: JWT tokens with refresh token rotation
- **Password Security**: BCrypt hashing
- **Rate Limiting**: Bucket4j with Redis integration
- **Email Service**: Spring Boot Mail Starter
- **OAuth Integration**: Firebase Admin SDK (Google), LINE Bot SDK

### **Frontend Stack (Next.js)**
- **Framework**: Next.js 15.5.0 with React 19
- **State Management**: React Context + Zustand
- **HTTP Client**: Axios
- **Cookie Management**: js-cookie
- **Form Handling**: React Hook Form
- **OAuth**: Firebase SDK, custom LINE integration
- **UI Components**: Radix UI, Tailwind CSS

---

## 🔐 **1. Login/Signup Implementation**

### **Implementation Logic**
- **Password-based Authentication**: Uses BCrypt for password hashing with salt
- **JWT Token System**: Dual token approach (access + refresh tokens)
- **Session Management**: Refresh token rotation for enhanced security
- **Input Validation**: Server-side validation with Spring Validation
- **Rate Limiting**: IP-based protection using Bucket4j

### **User Flow**
1. **Registration**:
   - User submits email, username, password, display name
   - Backend validates input and checks uniqueness
   - Password is hashed with BCrypt
   - User created with ACTIVE status but emailVerified=false
   - Verification email sent automatically
   - JWT tokens generated and returned

2. **Login**:
   - User submits email/password
   - Backend validates credentials
   - Rate limiting check (5 attempts/minute per IP)
   - JWT access token + refresh token generated
   - Tokens stored in secure HTTP-only cookies (frontend)
   - User redirected to dashboard

### **Workflow**
```
Frontend (Login Page) → AuthContext → API Client → Backend Controller → AuthService → UserRepository → Database
                    ← JWT Tokens ← LoginResponse ← Authentication ← Password Verification ←
```

### **File Responsibilities**
- **Frontend**:
  - "nomanweb_frontend\src\app\login\page.tsx" Login UI and form handling
  - <mcfile name="page.tsx" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_frontend\src\app\register\page.tsx"></mcfile>: Registration UI
  - <mcfile name="AuthContext.tsx" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_frontend\src\contexts\AuthContext.tsx"></mcfile>: Authentication state management
  - <mcfile name="auth.ts" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_frontend\src\lib\api\auth.ts"></mcfile>: API client methods

- **Backend**:
  - <mcfile name="AuthController.java" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_backend\src\main\java\com\app\nomanweb_backend\controller\AuthController.java"></mcfile>: Authentication endpoints
  - <mcfile name="AuthService.java" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_backend\src\main\java\com\app\nomanweb_backend\service\AuthService.java"></mcfile>: Business logic
  - <mcfile name="SecurityConfig.java" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_backend\src\main\java\com\app\nomanweb_backend\config\SecurityConfig.java"></mcfile>: Security configuration

---

## 🌐 **2. Google OAuth / LINE OAuth**

### **Implementation Logic**
- **Google OAuth**: Firebase Admin SDK for token verification
- **LINE OAuth**: Custom implementation using LINE Bot SDK
- **Account Linking**: Existing users can link social accounts
- **Auto-Registration**: New users automatically created from OAuth data
- **Profile Sync**: Avatar and basic info synced from providers

### **User Flow**
1. **OAuth Login**:
   - User clicks social login button
   - Redirected to provider (Google/LINE)
   - Provider returns authorization code/token
   - Frontend exchanges for access token
   - Backend validates token with provider
   - User profile retrieved and synced
   - JWT tokens generated

2. **Account Linking**:
   - Authenticated user initiates linking
   - OAuth flow completed
   - Social account linked to existing user
   - Profile data updated

### **Workflow**
```
Frontend → OAuth Provider → Callback Handler → Backend OAuth Service → User Creation/Update → JWT Generation
```

### **File Responsibilities**
- **Frontend**:
  - <mcfile name="page.tsx" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_frontend\src\app\auth\line\callback\page.tsx"></mcfile>: LINE OAuth callback
  - Firebase integration in login components

- **Backend**:
  - <mcfile name="OAuthService.java" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_backend\src\main\java\com\app\nomanweb_backend\service\OAuthService.java"></mcfile>: OAuth interface
  - <mcfile name="OAuthServiceImpl.java" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_backend\src\main\java\com\app\nomanweb_backend\service\impl\OAuthServiceImpl.java"></mcfile>: OAuth implementation

---

## 💾 **3. Remember Me**

### **Implementation Logic**
- **Client-side Storage**: Credentials stored in localStorage when enabled
- **Extended Token Expiry**: 7-day cookie expiration for remember me
- **Secure Storage**: Tokens stored in HTTP-only cookies
- **Auto-population**: Form fields auto-filled on return visits

### **User Flow**
1. User checks "Remember Me" during login
2. Credentials saved to localStorage
3. JWT tokens set with extended expiry (7 days)
4. On return visit, form auto-populated
5. User can login with saved credentials

### **Workflow**
```
Login Form → Remember Me Checkbox → localStorage Storage → Extended Cookie Expiry → Auto-population
```

### **File Responsibilities**
- <mcfile name="page.tsx" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_frontend\src\app\login\page.tsx"></mcfile>: Remember me logic (lines 34-53)
- <mcfile name="AuthContext.tsx" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_frontend\src\contexts\AuthContext.tsx"></mcfile>: Cookie management with 7-day expiry

---

## 🔄 **4. Forget Password / Send Reset Link**

### **Implementation Logic**
- **Secure Token Generation**: UUID-based reset tokens with expiration
- **Email Delivery**: SMTP integration for reset emails
- **Rate Limiting**: 3 attempts per hour per IP
- **Token Validation**: Server-side token verification and expiry check
- **Audit Logging**: IP and User-Agent tracking for security

### **User Flow**
1. **Request Reset**:
   - User enters email on forgot password page
   - Backend generates secure reset token (24-hour expiry)
   - Reset email sent with token link
   - Rate limiting applied

2. **Reset Password**:
   - User clicks email link with token
   - Token validated on backend
   - New password form presented
   - Password updated and token invalidated

### **Workflow**
```
Forgot Password Page → Email Input → Backend Validation → Token Generation → Email Service → Reset Link → New Password → Token Validation → Password Update
```

### **File Responsibilities**
- **Frontend**:
  - <mcfile name="page.tsx" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_frontend\src\app\forgot-password\page.tsx"></mcfile>: Forgot password UI
  - <mcfile name="page.tsx" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_frontend\src\app\reset-password\page.tsx"></mcfile>: Reset password UI

- **Backend**:
  - Password reset endpoints in <mcfile name="AuthController.java" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_backend\src\main\java\com\app\nomanweb_backend\controller\AuthController.java"></mcfile> (lines 113-131)
  - Email service integration in <mcfile name="AuthService.java" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_backend\src\main\java\com\app\nomanweb_backend\service\AuthService.java"></mcfile>

---

## 📧 **5. Email Verification / Resend Verification**

### **Implementation Logic**
- **Automatic Verification**: Email sent immediately after registration
- **Token-based Verification**: Secure UUID tokens with expiration
- **Status Tracking**: emailVerified boolean flag on user entity
- **Resend Functionality**: Rate-limited resend capability
- **OAuth Pre-verification**: Social login emails marked as verified

### **User Flow**
1. **Initial Verification**:
   - User registers account
   - Verification email sent automatically
   - User clicks verification link
   - Token validated and email marked verified

2. **Resend Verification**:
   - User requests resend from login/profile page
   - Rate limiting check (3 attempts/hour)
   - New verification email sent

### **Workflow**
```
Registration → Auto Email Send → User Email Click → Token Validation → Email Verified Status Update
Resend Request → Rate Limit Check → New Email Send → Verification Complete
```

### **File Responsibilities**
- **Frontend**:
  - <mcfile name="page.tsx" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_frontend\src\app\verify-email\page.tsx"></mcfile>: Email verification UI

- **Backend**:
  - Verification endpoints in <mcfile name="AuthController.java" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_backend\src\main\java\com\app\nomanweb_backend\controller\AuthController.java"></mcfile> (lines 192-211)
  - Email verification logic in <mcfile name="AuthService.java" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_backend\src\main\java\com\app\nomanweb_backend\service\AuthService.java"></mcfile>

---

## 🛡️ **6. Rate Limiting**

### **Implementation Logic**
- **Token Bucket Algorithm**: Bucket4j implementation with Redis backend
- **IP-based Limiting**: Rate limits applied per client IP address
- **Multiple Limit Types**: Different limits for different operations
- **Sliding Window**: Refill intervals for sustained protection
- **Graceful Degradation**: HTTP 429 responses when limits exceeded

### **Rate Limit Configuration**
- **Login**: 5 attempts per minute per IP
- **Registration**: 5 attempts per hour per IP  
- **Password Reset**: 3 attempts per hour per IP
- **Email Verification**: 3 attempts per hour per IP
- **Email Change**: 3 attempts per hour per IP

### **User Flow**
1. User makes authentication request
2. IP address extracted from request
3. Rate limit bucket checked for IP + operation type
4. If limit exceeded, HTTP 429 returned
5. If allowed, request proceeds normally
6. Token consumed from bucket

### **Workflow**
```
Incoming Request → IP Extraction → Rate Limit Check → Bucket4j Validation → Allow/Deny Decision → Response
```

### **File Responsibilities**
- **Backend**:
  - <mcfile name="RateLimitService.java" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_backend\src\main\java\com\app\nomanweb_backend\service\RateLimitService.java"></mcfile>: Rate limiting implementation
  - Applied in all auth endpoints in <mcfile name="AuthController.java" path="c:\Users\saihe\Downloads\Nomanweb\nomanweb_backend\src\main\java\com\app\nomanweb_backend\controller\AuthController.java"></mcfile>

---

## 🔧 **Key Dependencies & Libraries**

### **Backend Dependencies**
- **Spring Boot Starter Security**: Core security framework
- **Spring Boot Starter Data JPA**: Database operations
- **Spring Boot Starter Mail**: Email functionality
- **Spring Boot Starter Data Redis**: Caching and rate limiting
- **JWT (jjwt)**: Token generation and validation
- **BCrypt**: Password hashing
- **Bucket4j**: Rate limiting with Redis
- **Firebase Admin SDK**: Google OAuth integration
- **LINE Bot SDK**: LINE OAuth integration
- **PostgreSQL Driver**: Database connectivity

### **Frontend Dependencies**
- **Next.js**: React framework with SSR
- **React Hook Form**: Form validation and handling
- **Axios**: HTTP client for API calls
- **js-cookie**: Cookie management
- **Firebase**: Google OAuth integration
- **React Hot Toast**: User notifications
- **Zustand**: Additional state management

---

## 🏛️ **Security Architecture**

### **Multi-layered Security**
1. **Input Validation**: Server-side validation with Spring Validation
2. **Rate Limiting**: Bucket4j with Redis for distributed rate limiting
3. **Password Security**: BCrypt hashing with salt
4. **JWT Security**: Signed tokens with role-based claims
5. **Session Management**: Refresh token rotation
6. **CORS Protection**: Configured for specific origins
7. **Audit Logging**: IP and User-Agent tracking
8. **Role-based Access**: ADMIN vs USER permissions

### **Token Management**
- **Access Tokens**: Short-lived (configurable expiry)
- **Refresh Tokens**: Longer-lived with rotation
- **Secure Storage**: HTTP-only cookies on frontend
- **Token Validation**: JWT signature verification
- **Automatic Refresh**: Seamless token renewal

This implementation provides enterprise-grade authentication with comprehensive security measures, scalable architecture, and excellent user experience across all authentication scenarios.
        
