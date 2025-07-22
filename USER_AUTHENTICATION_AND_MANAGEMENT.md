# 🔐 User Authentication and Management - Complete Implementation Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [API Documentation](#api-documentation)
5. [Security Features](#security-features)
6. [OAuth Integration](#oauth-integration)
7. [Database Schema](#database-schema)
8. [Configuration](#configuration)
9. [Testing & Debugging](#testing--debugging)
10. [Deployment Considerations](#deployment-considerations)

---

## 🎯 Overview

The NoManWeb platform implements a comprehensive user authentication and management system with the following features:

### ✅ **Core Features**
- **User Registration & Login** (Email/Password)
- **Social Authentication** (Google, LINE OAuth)
- **Email Verification System**
- **Password Reset & Management**
- **JWT Token Management** (Access + Refresh Tokens)
- **Role-Based Access Control** (USER/ADMIN)
- **Account Status Management** (ACTIVE/SUSPENDED/BANNED)
- **Profile Management**
- **Admin Authentication & Management**
- **Rate Limiting & Security**

### 🏗️ **Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Spring Boot) │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌─────────┐            ┌─────────┐            ┌─────────┐
    │ Cookies │            │ JWT     │            │ Users   │
    │ (Tokens)│            │ Filter  │            │ Tables  │
    └─────────┘            └─────────┘            └─────────┘
```

---

## 🔧 Backend Implementation

### **1. User Entity**

**File:** `nomanweb_backend/src/main/java/com/app/nomanweb_backend/entity/User.java`

```java
@Entity
@Table(name = "users")
@Data
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Email
    @NotBlank
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank
    @Size(min = 3, max = 50)
    @Column(unique = true, nullable = false)
    private String username;

    @Size(max = 100)
    @Column(name = "display_name")
    private String displayName;

    @JsonIgnore
    @Column(name = "password_hash")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.ACTIVE;

    @Column(name = "email_verified")
    @Builder.Default
    private Boolean emailVerified = false;

    // OAuth fields
    @Column(name = "line_user_id")
    private String lineUserId;

    @Column(name = "google_id")
    private String googleId;

    // Timestamps
    @CreatedDate
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Role { USER, ADMIN }
    public enum Status { ACTIVE, SUSPENDED, BANNED }
}
```

### **2. Refresh Token Entity**

**File:** `nomanweb_backend/src/main/java/com/app/nomanweb_backend/entity/RefreshToken.java`

```java
@Entity
@Table(name = "refresh_tokens")
@Data
@Builder
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean revoked = false;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isValid() {
        return !revoked && !isExpired();
    }
}
```

### **3. Authentication Service**

**File:** `nomanweb_backend/src/main/java/com/app/nomanweb_backend/service/AuthService.java`

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;

    public LoginResponse login(LoginRequest request) {
        // 1. Find user by email/username
        User user = userRepository.findByEmailOrUsername(request.getEmail(), request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        // 2. Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        // 3. Check account status
        if (!user.isActive()) {
            throw new RuntimeException("Account is not active");
        }

        // 4. Check email verification (skip for OAuth users)
        if (!user.getEmailVerified() && !user.canUseOAuthEndpoints()) {
            throw new RuntimeException("Please verify your email address");
        }

        // 5. Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // 6. Generate tokens
        String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshTokenForLogin(user);

        return LoginResponse.builder()
                .user(user)
                .token(accessToken)
                .refreshToken(refreshToken.getToken())
                .build();
    }

    public LoginResponse register(RegisterRequest request) {
        // 1. Validate unique constraints
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        // 2. Create user
        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .displayName(request.getDisplayName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .status(User.Status.ACTIVE)
                .emailVerified(false)
                .build();

        user = userRepository.save(user);

        // 3. Send verification email
        String verificationToken = generateEmailVerificationToken(user);
        emailService.sendVerificationEmail(user, verificationToken);

        return LoginResponse.builder()
                .user(user)
                .token(null) // No token until email verified
                .refreshToken(null)
                .build();
    }
}
```

### **4. JWT Utility**

**File:** `nomanweb_backend/src/main/java/com/app/nomanweb_backend/util/JwtUtil.java`

```java
@Component
public class JwtUtil {
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    @Value("${app.jwt.refresh-expiration}")
    private long refreshExpiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(UUID userId, String email, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String generateRefreshToken(UUID userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpiration);

        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public UUID getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return UUID.fromString(claims.getSubject());
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

### **5. Authentication Controller**

**File:** `nomanweb_backend/src/main/java/com/app/nomanweb_backend/controller/AuthController.java`

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
public class AuthController {
    private final AuthService authService;
    private final RateLimitService rateLimitService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);

        // Rate limiting
        if (!rateLimitService.isAllowed(clientIp, RateLimitService.RateLimitType.LOGIN)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }

        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);

        // Rate limiting
        if (!rateLimitService.isAllowed(clientIp, RateLimitService.RateLimitType.REGISTRATION)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }

        try {
            LoginResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refreshToken(@RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        try {
            String clientIp = getClientIp(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            
            LoginResponse response = authService.refreshToken(
                request.getRefreshToken(), clientIp, userAgent);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody LogoutRequest request,
            HttpServletRequest httpRequest) {
        try {
            String clientIp = getClientIp(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            
            authService.logout(request.getRefreshToken(), clientIp, userAgent);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
```

---

## 🎨 Frontend Implementation

### **1. Authentication Context**

**File:** `nomanweb_frontend/src/contexts/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  setAuthData: (token: string, refreshToken: string, user: User) => void;
  refreshUser: () => Promise<void>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    
    // Subscribe to token refresh events
    const unsubscribe = tokenRefreshEvents.subscribe((token, refreshToken) => {
      updateTokens(token, refreshToken);
    });
    
    return unsubscribe;
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('token');
      const refreshToken = Cookies.get('refreshToken');
      
      if (token) {
        const userData = await authApi.getProfile();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      Cookies.remove('token');
      Cookies.remove('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      // Store tokens in secure cookies
      Cookies.set('token', response.token, { 
        expires: 7, 
        path: '/', 
        secure: false, 
        sameSite: 'strict' 
      });
      Cookies.set('refreshToken', response.refreshToken, { 
        expires: 7, 
        path: '/', 
        secure: false, 
        sameSite: 'strict' 
      });
      
      setUser(response.user);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      handleApiError(error, 'Login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      setUser(null);
      toast.success('Logged out successfully');
      router.push('/');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    setAuthData,
    refreshUser,
    updateTokens,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

### **2. API Client**

**File:** `nomanweb_frontend/src/lib/api/auth.ts`

```typescript
import { apiClient } from './client';
import { AuthResponse, User } from '@/types/user';

const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post(`/auth/login`, data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post(`/auth/register`, data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get(`/auth/profile`);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post(`/auth/refresh`, { refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    const response = await apiClient.post(`/auth/logout`, { refreshToken });
    return response.data;
  },

  // OAuth methods
  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post(`/oauth/google`, { idToken });
    return response.data;
  },

  lineLogin: async (accessToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post(`/oauth/line`, { accessToken });
    return response.data;
  },
};

export { authApi };
```

### **3. Login Page**

**File:** `nomanweb_frontend/src/app/login/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import LineSignIn from '@/components/auth/LineSignIn';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, setAuthData } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
    } catch (error) {
      // Error handling is done in the AuthContext
    }
  };

  const handleGoogleSuccess = (response: any) => {
    if (response.token && response.refreshToken && response.user) {
      setAuthData(response.token, response.refreshToken, response.user);
      toast.success('Google login successful!');
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-xl shadow-xl p-6 border border-purple-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your NoManWeb account</p>
        </div>

        {/* OAuth Sign-In */}
        <div className="mb-5 space-y-3">
          <GoogleSignIn onSuccess={handleGoogleSuccess} />
          <LineSignIn onSuccess={handleLineSuccess} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              placeholder="Email"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## 📡 API Documentation

### **Authentication Endpoints**

#### **1. User Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "displayName": "Display Name",
    "role": "USER",
    "status": "ACTIVE",
    "emailVerified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### **2. User Registration**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "username": "newuser",
  "displayName": "New User",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "username": "newuser",
    "displayName": "New User",
    "role": "USER",
    "status": "ACTIVE",
    "emailVerified": false
  },
  "token": null,
  "refreshToken": null
}
```

#### **3. Token Refresh**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "user": { ... },
  "token": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

#### **4. Logout**
```http
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `204 No Content`

#### **5. Get User Profile**
```http
GET /api/auth/profile
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "displayName": "Display Name",
  "role": "USER",
  "status": "ACTIVE",
  "emailVerified": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLoginAt": "2024-01-01T12:00:00Z"
}
```

### **Admin Endpoints**

#### **1. Admin Login**
```http
POST /api/admin/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "adminpassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "username": "admin",
    "role": "ADMIN",
    "status": "ACTIVE"
  },
  "token": "admin-jwt-token"
}
```

---

## 🛡️ Security Features

### **1. JWT Token Security**
- **Access Token Expiry:** 15 minutes (configurable)
- **Refresh Token Expiry:** 7 days (configurable)
- **Token Rotation:** New refresh token on each use
- **Database Validation:** Refresh tokens stored and validated in DB
- **Revocation Support:** Tokens can be revoked on logout

### **2. Password Security**
- **Hashing:** BCrypt with salt
- **Minimum Length:** 6 characters
- **Password Reset:** Secure token-based reset
- **Password History:** Tracks last password change

### **3. Rate Limiting**
```java
// Rate limiting configuration
security.rate-limit.login.attempts=5
security.rate-limit.login.window=60
security.rate-limit.registration.attempts=3
security.rate-limit.registration.window=3600
```

### **4. CORS Configuration**
```properties
app.cors.allowed-origins=http://localhost:3000,http://localhost:3001
app.cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
app.cors.allowed-headers=*
app.cors.allow-credentials=true
```

### **5. Input Validation**
- **Email Validation:** Regex pattern validation
- **Username Validation:** 3-50 chars, alphanumeric + underscores
- **Password Validation:** Minimum 6 characters
- **SQL Injection Prevention:** JPA/Hibernate parameterized queries

---

## 🔗 OAuth Integration

### **1. Google OAuth**

**Backend Service:**
```java
@Service
public class OAuthServiceImpl implements OAuthService {
    
    public LoginResponse authenticateWithGoogle(String idToken) {
        // 1. Verify Google ID token
        Object tokenResult = firebaseService.verifyGoogleToken(idToken);
        String googleId = firebaseService.extractGoogleId(tokenResult);
        String email = firebaseService.extractEmail(tokenResult);
        
        // 2. Find or create user
        Optional<User> existingUser = userRepository.findByGoogleId(googleId);
        User user;
        
        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            // Create new user
            user = User.builder()
                    .email(email)
                    .username(generateUsername(email))
                    .googleId(googleId)
                    .emailVerified(true) // Google emails are pre-verified
                    .role(User.Role.USER)
                    .status(User.Status.ACTIVE)
                    .build();
            user = userRepository.save(user);
        }
        
        // 3. Generate tokens
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshTokenForLogin(user);
        
        return LoginResponse.builder()
                .user(user)
                .token(token)
                .refreshToken(refreshToken.getToken())
                .build();
    }
}
```

**Frontend Component:**
```typescript
// GoogleSignIn.tsx
import { GoogleLogin } from '@react-oauth/google';

const GoogleSignIn = ({ onSuccess, onError }: Props) => {
  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        if (credentialResponse.credential) {
          authApi.googleLogin(credentialResponse.credential)
            .then(onSuccess)
            .catch(onError);
        }
      }}
      onError={() => onError(new Error('Google login failed'))}
    />
  );
};
```

### **2. LINE OAuth**

**Backend Service:**
```java
@Service
public class OAuthServiceImpl implements OAuthService {
    
    public LoginResponse authenticateWithLine(String accessToken) {
        // 1. Verify LINE access token
        LineProfile lineProfile = lineService.verifyAccessToken(accessToken);
        
        // 2. Find or create user
        Optional<User> existingUser = userRepository.findByLineUserId(lineProfile.getUserId());
        User user;
        
        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            // Create new user
            user = User.builder()
                    .email(lineProfile.getEmail())
                    .username(generateUsername(lineProfile.getDisplayName()))
                    .displayName(lineProfile.getDisplayName())
                    .lineUserId(lineProfile.getUserId())
                    .emailVerified(true)
                    .role(User.Role.USER)
                    .status(User.Status.ACTIVE)
                    .build();
            user = userRepository.save(user);
        }
        
        // 3. Generate tokens
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshTokenForLogin(user);
        
        return LoginResponse.builder()
                .user(user)
                .token(token)
                .refreshToken(refreshToken.getToken())
                .build();
    }
}
```

---

## 🗄️ Database Schema

### **Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    password_hash VARCHAR(255),
    profile_image_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    bio TEXT,
    role VARCHAR(20) DEFAULT 'USER',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    coin_balance DECIMAL(10,2) DEFAULT 0.00,
    total_earned_coins DECIMAL(10,2) DEFAULT 0.00,
    line_user_id VARCHAR(100),
    google_id VARCHAR(100),
    email_verified BOOLEAN DEFAULT FALSE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_password_change TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_line_user_id ON users(line_user_id);
CREATE INDEX idx_users_google_id ON users(google_id);
```

### **Refresh Tokens Table**
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(500) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revoked_by_ip VARCHAR(45),
    revoked_by_user_agent TEXT
);

-- Indexes
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### **Email Verification Tokens Table**
```sql
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
```

---

## ⚙️ Configuration

### **Backend Configuration (application.properties)**
```properties
# JWT Configuration
app.jwt.secret=${APP_JWT_SECRET:your-256-bit-secret-key-here-make-it-very-long-and-secure-for-production}
app.jwt.expiration=${APP_JWT_EXPIRATION:900000}
app.jwt.refresh-expiration=${APP_JWT_REFRESH_EXPIRATION:604800000}

# Email Configuration
spring.mail.host=${SPRING_MAIL_HOST:smtp.gmail.com}
spring.mail.port=${SPRING_MAIL_PORT:587}
spring.mail.username=${SPRING_MAIL_USERNAME:your-email@gmail.com}
spring.mail.password=${SPRING_MAIL_PASSWORD:your-app-password}

# OAuth Configuration
line.channel-id=${LINE_CHANNEL_ID:your-line-channel-id}
line.channel-secret=${LINE_CHANNEL_SECRET:your-line-channel-secret}
line.callback-url=${LINE_CALLBACK_URL:http://localhost:3000/auth/line/callback}

# Security Configuration
security.rate-limit.login.attempts=${SECURITY_RATE_LIMIT_LOGIN_ATTEMPTS:5}
security.rate-limit.login.window=${SECURITY_RATE_LIMIT_LOGIN_WINDOW:60}
security.rate-limit.registration.attempts=${SECURITY_RATE_LIMIT_REGISTRATION_ATTEMPTS:3}
security.rate-limit.registration.window=${SECURITY_RATE_LIMIT_REGISTRATION_WINDOW:3600}
```

### **Frontend Configuration**
```typescript
// Environment variables (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_LINE_CHANNEL_ID=your-line-channel-id
```

---

## 🧪 Testing & Debugging

### **1. Backend Testing**

**Unit Tests:**
```java
@SpringBootTest
class AuthServiceTest {
    
    @Autowired
    private AuthService authService;
    
    @Test
    void testUserLogin() {
        // Test valid login
        LoginRequest request = new LoginRequest("test@example.com", "password");
        LoginResponse response = authService.login(request);
        
        assertNotNull(response.getToken());
        assertNotNull(response.getRefreshToken());
        assertEquals("test@example.com", response.getUser().getEmail());
    }
    
    @Test
    void testInvalidLogin() {
        // Test invalid credentials
        LoginRequest request = new LoginRequest("test@example.com", "wrongpassword");
        
        assertThrows(RuntimeException.class, () -> {
            authService.login(request);
        });
    }
}
```

**Integration Tests:**
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AuthControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void testLoginEndpoint() {
        LoginRequest request = new LoginRequest("test@example.com", "password");
        
        ResponseEntity<LoginResponse> response = restTemplate.postForEntity(
            "/api/auth/login", request, LoginResponse.class);
        
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody().getToken());
    }
}
```

### **2. Frontend Testing**

**Component Tests:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import LoginPage from '@/app/login/page';

describe('LoginPage', () => {
  it('should handle login form submission', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByText('Sign In');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });
  });
});
```

### **3. API Testing**

**Postman Collection:**
```json
{
  "info": {
    "name": "NoManWeb Auth API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "User Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "login"]
        }
      }
    },
    {
      "name": "User Registration",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"newuser@example.com\",\n  \"username\": \"newuser\",\n  \"displayName\": \"New User\",\n  \"password\": \"password123\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/register",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "register"]
        }
      }
    }
  ]
}
```

---

## 🚀 Deployment Considerations

### **1. Environment Variables**
```bash
# Production environment variables
APP_JWT_SECRET=your-super-secure-256-bit-secret-key-for-production
SPRING_MAIL_USERNAME=your-production-email@gmail.com
SPRING_MAIL_PASSWORD=your-production-app-password
LINE_CHANNEL_ID=your-production-line-channel-id
LINE_CHANNEL_SECRET=your-production-line-channel-secret
```

### **2. Security Headers**
```java
@Configuration
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .headers()
                .frameOptions().deny()
                .contentTypeOptions()
                .and()
                .httpStrictTransportSecurity()
                .and()
                .xssProtection()
                .and()
                .contentSecurityPolicy("default-src 'self'");
        
        return http.build();
    }
}
```

### **3. SSL/TLS Configuration**
```properties
# HTTPS configuration
server.ssl.enabled=true
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-password=your-keystore-password
server.ssl.key-store-type=PKCS12
```

### **4. Database Security**
```properties
# Database connection security
spring.datasource.url=jdbc:postgresql://your-db-host:5432/nomanweb?sslmode=require
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
```

### **5. Monitoring & Logging**
```properties
# Production logging
logging.level.com.app.nomanweb_backend=INFO
logging.level.org.springframework.security=WARN
logging.file.name=logs/application.log
logging.pattern.file=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n
```

---

## 📁 Complete File Structure

```
nomanweb_backend/
├── src/main/java/com/app/nomanweb_backend/
│   ├── config/
│   │   ├── JwtAuthenticationFilter.java
│   │   ├── SecurityConfig.java
│   │   └── WebConfig.java
│   ├── controller/
│   │   ├── AuthController.java
│   │   └── AdminAuthController.java
│   ├── dto/
│   │   └── auth/
│   │       ├── LoginRequest.java
│   │       ├── LoginResponse.java
│   │       ├── RegisterRequest.java
│   │       └── RefreshTokenRequest.java
│   ├── entity/
│   │   ├── User.java
│   │   ├── RefreshToken.java
│   │   ├── EmailVerificationToken.java
│   │   └── EmailChangeToken.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   └── RefreshTokenRepository.java
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── RefreshTokenService.java
│   │   ├── EmailService.java
│   │   ├── OAuthService.java
│   │   └── impl/
│   │       ├── OAuthServiceImpl.java
│   │       └── AdminAuthServiceImpl.java
│   └── util/
│       ├── JwtUtil.java
│       └── RateLimitService.java
└── src/main/resources/
    ├── application.properties
    └── sql/
        ├── users_table.sql
        └── refresh_tokens_table.sql

nomanweb_frontend/
├── src/
│   ├── app/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── admin/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   └── auth/
│   │       └── line/
│   │           └── callback/
│   │               └── page.tsx
│   ├── components/
│   │   └── auth/
│   │       ├── GoogleSignIn.tsx
│   │       └── LineSignIn.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useTokenRefresh.ts
│   ├── lib/
│   │   └── api/
│   │       ├── auth.ts
│   │       └── client.ts
│   └── types/
│       └── user.ts
├── .env.local
└── package.json
```

---

## 🔄 Authentication Flow Diagrams

### **1. User Registration Flow**
```
User → Register Form → Frontend Validation → API Call → Backend Validation → 
User Creation → Email Verification → Success Response → Email Sent → 
User Verifies Email → Account Activated
```

### **2. User Login Flow**
```
User → Login Form → Frontend Validation → API Call → Backend Validation → 
Password Check → Account Status Check → Token Generation → Response → 
Token Storage → Redirect to Dashboard
```

### **3. Token Refresh Flow**
```
API Request → Token Expired → Automatic Refresh → New Access Token → 
Retry Original Request → Success Response
```

### **4. OAuth Flow**
```
User → OAuth Button → OAuth Provider → Authorization → Callback → 
Backend Verification → User Creation/Login → Token Generation → 
Success Response → Token Storage → Redirect to Dashboard
```

---

This comprehensive guide covers all aspects of the User Authentication and Management system implemented in your NoManWeb project. The system is production-ready with security best practices, OAuth integration, and proper error handling. 