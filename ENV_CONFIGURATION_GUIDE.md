# NoManWeb Environment Variables Configuration Guide

This guide will help you set up environment variables for both the backend (Spring Boot) and frontend (Next.js) to support development, staging, and production environments, including CI/CD pipelines.

## 🏗️ Project Structure Overview

```
Nomanweb/
├── nomanweb_backend/          # Spring Boot backend
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── .env                   # Development environment (create this)
│   ├── .env.production        # Production environment (create this)
│   └── .env.staging           # Staging environment (create this)
├── nomanweb_frontend/         # Next.js frontend
│   ├── .env.local             # Development environment (create this)
│   ├── .env.production        # Production environment (create this)
│   ├── .env.staging           # Staging environment (create this)
│   └── .env.example           # Template file (create this)
└── .gitignore                 # Make sure .env* files are ignored
```

## 🔧 Backend Configuration (Spring Boot)

### Step 1: Create Backend Environment Files

#### Development Environment (`nomanweb_backend/.env`)
```bash
# =============================================================================
# BACKEND DEVELOPMENT ENVIRONMENT
# =============================================================================

# Application Configuration
SPRING_APPLICATION_NAME=nomanweb-backend
SERVER_PORT=8080

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/nomanweb
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=2480

# Redis Configuration
SPRING_DATA_REDIS_HOST=localhost
SPRING_DATA_REDIS_PORT=6379
SPRING_DATA_REDIS_PASSWORD=

# Typesense Configuration
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=d4b1a1f3-e5c2-4a8d-9f7b-6c3a9e8d2f1a

# JWT Configuration
APP_JWT_SECRET=your-256-bit-secret-key-here-make-it-very-long-and-secure-for-development
APP_JWT_EXPIRATION=86400000
APP_JWT_REFRESH_EXPIRATION=604800000

# Email Configuration
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=saiheinthuyasoe@gmail.com
SPRING_MAIL_PASSWORD=stnp gloa vqsv aovw

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dou5xwcdi
CLOUDINARY_API_KEY=591472543194672
CLOUDINARY_API_SECRET=ui3Qg137HrclpxOswV4ZM8GazZk

# LINE Configuration
LINE_BOT_CHANNEL_TOKEN=cjjfkSqIMuc7ya/q/AJhLF94FkoZ3g2Wu2tnqYA0ts4JCkNu6YQS3LfZGnpJXJPlug2tg3GimZRy2pYfH3Xj8cyo0plfUqX/wPhLp0NmvqfaN3h5/VYILPMHZCi2UrNIN2J3xSGEQO8zkCzx1GM+GgdB04t89/1O/w1cDnyilFU=
LINE_BOT_CHANNEL_SECRET=54224a25944c0d83237e9b1e0c36686d
LINE_CHANNEL_ID=2007499018
LINE_CHANNEL_SECRET=fde2263703ef7429ba83b5d1daa5b9de
LINE_CALLBACK_URL=http://localhost:3000/auth/line/callback

# Application Settings
APP_FRONTEND_URL=http://localhost:3000
APP_EMAIL_FROM=saiheinthuyasoe@gmail.com
APP_EMAIL_VERIFICATION_EXPIRY=48
APP_PASSWORD_RESET_EXPIRY=24

# CORS Configuration
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
APP_CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
APP_CORS_ALLOWED_HEADERS=*
APP_CORS_ALLOW_CREDENTIALS=true

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_KEY=firebase-service-account.json

# Security Configuration
SECURITY_RATE_LIMIT_LOGIN_ATTEMPTS=5
SECURITY_RATE_LIMIT_LOGIN_WINDOW=60
SECURITY_RATE_LIMIT_REGISTRATION_ATTEMPTS=3
SECURITY_RATE_LIMIT_REGISTRATION_WINDOW=3600
SECURITY_RATE_LIMIT_PASSWORD_RESET_ATTEMPTS=3
SECURITY_RATE_LIMIT_PASSWORD_RESET_WINDOW=3600

# Logging Configuration (DEBUG for development)
LOGGING_LEVEL_COM_APP_NOMANWEB_BACKEND=DEBUG
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_SECURITY=DEBUG
LOGGING_LEVEL_ORG_HIBERNATE_SQL=DEBUG
LOGGING_LEVEL_ORG_HIBERNATE_TYPE_DESCRIPTOR_SQL_BASICBINDER=TRACE
LOGGING_LEVEL_ORG_HIBERNATE_TOOL_HBM2DDL=DEBUG
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_ORM_JPA=DEBUG

# JPA Configuration
SPRING_JPA_HIBERNATE_DDL_AUTO=update
SPRING_JPA_SHOW_SQL=true
SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect
SPRING_JPA_GENERATE_DDL=true

# File Upload Configuration
SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE=10MB
SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE=10MB

# Actuator Configuration
MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info,metrics
MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS=when-authorized
```

#### Production Environment (`nomanweb_backend/.env.production`)
```bash
# =============================================================================
# BACKEND PRODUCTION ENVIRONMENT
# =============================================================================

# Application Configuration
SPRING_APPLICATION_NAME=nomanweb-backend
SERVER_PORT=8080

# Database Configuration (Use your production database)
SPRING_DATASOURCE_URL=jdbc:postgresql://your-prod-db-host:5432/nomanweb_prod
SPRING_DATASOURCE_USERNAME=your_prod_db_user
SPRING_DATASOURCE_PASSWORD=your_strong_prod_db_password

# Redis Configuration (Use your production Redis)
SPRING_DATA_REDIS_HOST=your-prod-redis-host
SPRING_DATA_REDIS_PORT=6379
SPRING_DATA_REDIS_PASSWORD=your_redis_password

# Typesense Configuration (Use your production Typesense)
TYPESENSE_HOST=your-prod-typesense-host
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=your_production_typesense_api_key

# JWT Configuration (Use strong secrets)
APP_JWT_SECRET=your-very-strong-256-bit-secret-key-for-production-use-random-generator
APP_JWT_EXPIRATION=86400000
APP_JWT_REFRESH_EXPIRATION=604800000

# Email Configuration (Production email service)
SPRING_MAIL_HOST=your-smtp-host
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your_production_email@yourdomain.com
SPRING_MAIL_PASSWORD=your_production_email_password

# Cloudinary Configuration (Production account)
CLOUDINARY_CLOUD_NAME=your_production_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_production_cloudinary_api_key
CLOUDINARY_API_SECRET=your_production_cloudinary_api_secret

# LINE Configuration (Production LINE apps)
LINE_BOT_CHANNEL_TOKEN=your_production_line_bot_channel_token
LINE_BOT_CHANNEL_SECRET=your_production_line_bot_channel_secret
LINE_CHANNEL_ID=your_production_line_channel_id
LINE_CHANNEL_SECRET=your_production_line_channel_secret
LINE_CALLBACK_URL=https://yourdomain.com/auth/line/callback

# Application Settings (Production domain)
APP_FRONTEND_URL=https://yourdomain.com
APP_EMAIL_FROM=noreply@yourdomain.com
APP_EMAIL_VERIFICATION_EXPIRY=48
APP_PASSWORD_RESET_EXPIRY=24

# CORS Configuration (Production domains)
APP_CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
APP_CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
APP_CORS_ALLOWED_HEADERS=*
APP_CORS_ALLOW_CREDENTIALS=true

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_KEY=firebase-service-account-prod.json

# Security Configuration (More restrictive for production)
SECURITY_RATE_LIMIT_LOGIN_ATTEMPTS=3
SECURITY_RATE_LIMIT_LOGIN_WINDOW=300
SECURITY_RATE_LIMIT_REGISTRATION_ATTEMPTS=2
SECURITY_RATE_LIMIT_REGISTRATION_WINDOW=3600
SECURITY_RATE_LIMIT_PASSWORD_RESET_ATTEMPTS=2
SECURITY_RATE_LIMIT_PASSWORD_RESET_WINDOW=3600

# Logging Configuration (INFO level for production)
LOGGING_LEVEL_COM_APP_NOMANWEB_BACKEND=INFO
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_SECURITY=WARN
LOGGING_LEVEL_ORG_HIBERNATE_SQL=WARN
LOGGING_LEVEL_ORG_HIBERNATE_TYPE_DESCRIPTOR_SQL_BASICBINDER=WARN
LOGGING_LEVEL_ORG_HIBERNATE_TOOL_HBM2DDL=WARN
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_ORM_JPA=WARN

# JPA Configuration (Conservative for production)
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_JPA_SHOW_SQL=false
SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect
SPRING_JPA_GENERATE_DDL=false

# File Upload Configuration
SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE=10MB
SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE=10MB

# Actuator Configuration (More secure for production)
MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info
MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS=never
```

### Step 2: Add Environment Variable Support to application.properties

Replace your current `nomanweb_backend/src/main/resources/application.properties` with this version that uses environment variables:

```properties
# Application Configuration
spring.application.name=${SPRING_APPLICATION_NAME:nomanweb-backend}
server.port=${SERVER_PORT:8080}

# Database Configuration - PostgreSQL
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/nomanweb}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME:postgres}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:2480}
spring.datasource.driver-class-name=${SPRING_DATASOURCE_DRIVER_CLASS_NAME:org.postgresql.Driver}

# JPA Configuration
spring.jpa.hibernate.ddl-auto=${SPRING_JPA_HIBERNATE_DDL_AUTO:update}
spring.jpa.show-sql=${SPRING_JPA_SHOW_SQL:true}
spring.jpa.properties.hibernate.dialect=${SPRING_JPA_DATABASE_PLATFORM:org.hibernate.dialect.PostgreSQLDialect}
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.use_sql_comments=true
spring.jpa.properties.hibernate.jdbc.lob.non_contextual_creation=true
spring.jpa.properties.hibernate.hbm2ddl.auto=${SPRING_JPA_HIBERNATE_DDL_AUTO:update}
spring.jpa.database-platform=${SPRING_JPA_DATABASE_PLATFORM:org.hibernate.dialect.PostgreSQLDialect}
spring.jpa.generate-ddl=${SPRING_JPA_GENERATE_DDL:true}

# Redis Configuration
spring.data.redis.host=${SPRING_DATA_REDIS_HOST:localhost}
spring.data.redis.port=${SPRING_DATA_REDIS_PORT:6379}
spring.data.redis.password=${SPRING_DATA_REDIS_PASSWORD:}
spring.data.redis.timeout=${SPRING_DATA_REDIS_TIMEOUT:60000ms}
spring.data.redis.lettuce.pool.max-active=${SPRING_DATA_REDIS_LETTUCE_POOL_MAX_ACTIVE:8}
spring.data.redis.lettuce.pool.max-idle=${SPRING_DATA_REDIS_LETTUCE_POOL_MAX_IDLE:8}
spring.data.redis.lettuce.pool.min-idle=${SPRING_DATA_REDIS_LETTUCE_POOL_MIN_IDLE:0}

# Typesense Configuration
typesense.host=${TYPESENSE_HOST:localhost}
typesense.port=${TYPESENSE_PORT:8108}
typesense.protocol=${TYPESENSE_PROTOCOL:http}
typesense.api-key=${TYPESENSE_API_KEY:d4b1a1f3-e5c2-4a8d-9f7b-6c3a9e8d2f1a}
typesense.connection-timeout=${TYPESENSE_CONNECTION_TIMEOUT:5000}
typesense.read-timeout=${TYPESENSE_READ_TIMEOUT:5000}

# JWT Configuration
app.jwt.secret=${APP_JWT_SECRET:your-256-bit-secret-key-here-make-it-very-long-and-secure-for-production}
app.jwt.expiration=${APP_JWT_EXPIRATION:86400000}
app.jwt.refresh-expiration=${APP_JWT_REFRESH_EXPIRATION:604800000}

# File Upload Configuration
spring.servlet.multipart.max-file-size=${SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE:10MB}
spring.servlet.multipart.max-request-size=${SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE:10MB}

# Email Configuration
spring.mail.host=${SPRING_MAIL_HOST:smtp.gmail.com}
spring.mail.port=${SPRING_MAIL_PORT:587}
spring.mail.username=${SPRING_MAIL_USERNAME:saiheinthuyasoe@gmail.com}
spring.mail.password=${SPRING_MAIL_PASSWORD:stnp gloa vqsv aovw}
spring.mail.properties.mail.smtp.auth=${SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH:true}
spring.mail.properties.mail.smtp.starttls.enable=${SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE:true}

# Cloudinary Configuration
cloudinary.cloud-name=${CLOUDINARY_CLOUD_NAME:dou5xwcdi}
cloudinary.api-key=${CLOUDINARY_API_KEY:591472543194672}
cloudinary.api-secret=${CLOUDINARY_API_SECRET:ui3Qg137HrclpxOswV4ZM8GazZk}

# LINE Bot Configuration
line.bot.channel-token=${LINE_BOT_CHANNEL_TOKEN:cjjfkSqIMuc7ya/q/AJhLF94FkoZ3g2Wu2tnqYA0ts4JCkNu6YQS3LfZGnpJXJPlug2tg3GimZRy2pYfH3Xj8cyo0plfUqX/wPhLp0NmvqfaN3h5/VYILPMHZCi2UrNIN2J3xSGEQO8zkCzx1GM+GgdB04t89/1O/w1cDnyilFU=}
line.bot.channel-secret=${LINE_BOT_CHANNEL_SECRET:54224a25944c0d83237e9b1e0c36686d}

# Application Settings
app.frontend.url=${APP_FRONTEND_URL:http://localhost:3000}
app.email.from=${APP_EMAIL_FROM:saiheinthuyasoe@gmail.com}
app.email.verification.expiry=${APP_EMAIL_VERIFICATION_EXPIRY:48}
app.password.reset.expiry=${APP_PASSWORD_RESET_EXPIRY:24}

# Logging Configuration
logging.level.com.app.nomanweb_backend=${LOGGING_LEVEL_COM_APP_NOMANWEB_BACKEND:DEBUG}
logging.level.org.springframework.security=${LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_SECURITY:DEBUG}
logging.level.org.hibernate.SQL=${LOGGING_LEVEL_ORG_HIBERNATE_SQL:DEBUG}
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=${LOGGING_LEVEL_ORG_HIBERNATE_TYPE_DESCRIPTOR_SQL_BASICBINDER:TRACE}
logging.level.org.hibernate.tool.hbm2ddl=${LOGGING_LEVEL_ORG_HIBERNATE_TOOL_HBM2DDL:DEBUG}
logging.level.org.springframework.orm.jpa=${LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_ORM_JPA:DEBUG}

# Actuator Configuration
management.endpoints.web.exposure.include=${MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE:health,info,metrics}
management.endpoint.health.show-details=${MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS:when-authorized}

# CORS Configuration
app.cors.allowed-origins=${APP_CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:3001}
app.cors.allowed-methods=${APP_CORS_ALLOWED_METHODS:GET,POST,PUT,DELETE,OPTIONS}
app.cors.allowed-headers=${APP_CORS_ALLOWED_HEADERS:*}
app.cors.allow-credentials=${APP_CORS_ALLOW_CREDENTIALS:true}

# Firebase Configuration
firebase.service-account-key=${FIREBASE_SERVICE_ACCOUNT_KEY:firebase-service-account.json}

# LINE OAuth Configuration
line.channel-id=${LINE_CHANNEL_ID:2007499018}
line.channel-secret=${LINE_CHANNEL_SECRET:fde2263703ef7429ba83b5d1daa5b9de}
line.callback-url=${LINE_CALLBACK_URL:http://localhost:3000/auth/line/callback}

# Security Configuration
security.rate-limit.login.attempts=${SECURITY_RATE_LIMIT_LOGIN_ATTEMPTS:5}
security.rate-limit.login.window=${SECURITY_RATE_LIMIT_LOGIN_WINDOW:60}
security.rate-limit.registration.attempts=${SECURITY_RATE_LIMIT_REGISTRATION_ATTEMPTS:3}
security.rate-limit.registration.window=${SECURITY_RATE_LIMIT_REGISTRATION_WINDOW:3600}
security.rate-limit.password-reset.attempts=${SECURITY_RATE_LIMIT_PASSWORD_RESET_ATTEMPTS:3}
security.rate-limit.password-reset.window=${SECURITY_RATE_LIMIT_PASSWORD_RESET_WINDOW:3600}
```

## 🖥️ Frontend Configuration (Next.js)

### Step 1: Create Frontend Environment Files

#### Development Environment (`nomanweb_frontend/.env.local`)
```bash
# =============================================================================
# FRONTEND DEVELOPMENT ENVIRONMENT
# =============================================================================

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCZmt2rv6mRCa5as6ja39lbN7OR5m5O2E8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=nomanweb-ssp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=nomanweb-ssp
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=nomanweb-ssp.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=178736588876
NEXT_PUBLIC_FIREBASE_APP_ID=1:178736588876:web:7d707f671e61cca5526ce9
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-GRSV3JGZZP

# LINE OAuth Configuration
NEXT_PUBLIC_LINE_CHANNEL_ID=2007499018
NEXT_PUBLIC_LINE_CHANNEL_SECRET=fde2263703ef7429ba83b5d1daa5b9de
NEXT_PUBLIC_LINE_CALLBACK_URL=http://localhost:3000/auth/line/callback

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=NoManWeb
NEXT_PUBLIC_APP_DESCRIPTION=Story Sharing Platform

# Development Settings
NODE_ENV=development
```

#### Production Environment (`nomanweb_frontend/.env.production`)
```bash
# =============================================================================
# FRONTEND PRODUCTION ENVIRONMENT
# =============================================================================

# API Configuration (Your production backend URL)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

# Firebase Configuration (Your production Firebase project)
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-production-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-production-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-production-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_production_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_production_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_production_measurement_id

# LINE OAuth Configuration (Your production LINE OAuth app)
NEXT_PUBLIC_LINE_CHANNEL_ID=your_production_line_channel_id
NEXT_PUBLIC_LINE_CHANNEL_SECRET=your_production_line_channel_secret
NEXT_PUBLIC_LINE_CALLBACK_URL=https://yourdomain.com/auth/line/callback

# Application Configuration (Your production domain)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=NoManWeb
NEXT_PUBLIC_APP_DESCRIPTION=Story Sharing Platform

# Production Settings
NODE_ENV=production
```

### Step 2: Create Template File (`nomanweb_frontend/.env.example`)
```bash
# Copy this file to .env.local and fill in your values

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# LINE OAuth Configuration
NEXT_PUBLIC_LINE_CHANNEL_ID=your_line_channel_id
NEXT_PUBLIC_LINE_CHANNEL_SECRET=your_line_channel_secret
NEXT_PUBLIC_LINE_CALLBACK_URL=http://localhost:3000/auth/line/callback

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=NoManWeb
NEXT_PUBLIC_APP_DESCRIPTION=Story Sharing Platform

NODE_ENV=development
```

## 📄 Backend Environment Loading

### Add dotenv dependency to Spring Boot

Add this to your `nomanweb_backend/pom.xml`:

```xml
<dependency>
    <groupId>me.paulschwarz</groupId>
    <artifactId>spring-dotenv</artifactId>
    <version>2.5.4</version>
</dependency>
```

### Enable .env loading in Spring Boot

Create or update your main application class:

```java
@SpringBootApplication
@PropertySource("classpath:application.properties")
@PropertySource(value = "file:.env", ignoreResourceNotFound = true)
public class NomanwebBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(NomanwebBackendApplication.class, args);
    }
}
```

## 🔒 Security & .gitignore

### Update .gitignore
Make sure your root `.gitignore` includes:

```gitignore
# Environment Variables
.env
.env.local
.env.development
.env.staging
.env.production
.env.test

# Backend specific
nomanweb_backend/.env*
!nomanweb_backend/.env.example

# Frontend specific
nomanweb_frontend/.env*
!nomanweb_frontend/.env.example

# Logs
*.log
logs/

# Dependencies
node_modules/
target/

# IDE
.vscode/
.idea/
*.iml

# OS
.DS_Store
Thumbs.db
```

## 🚀 CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Application

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Java
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    # Backend Tests
    - name: Test Backend
      working-directory: ./nomanweb_backend
      run: |
        ./mvnw test
      env:
        SPRING_DATASOURCE_URL: ${{ secrets.TEST_DB_URL }}
        SPRING_DATASOURCE_USERNAME: ${{ secrets.TEST_DB_USERNAME }}
        SPRING_DATASOURCE_PASSWORD: ${{ secrets.TEST_DB_PASSWORD }}
    
    # Frontend Tests
    - name: Test Frontend
      working-directory: ./nomanweb_frontend
      run: |
        npm ci
        npm run build
      env:
        NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
        NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
        # Add other frontend environment variables
    
    # Deploy to Production
    - name: Deploy to Production
      if: github.ref == 'refs/heads/main'
      run: |
        # Your deployment script here
        echo "Deploying to production..."
      env:
        # Production environment variables
        SPRING_DATASOURCE_URL: ${{ secrets.PROD_DB_URL }}
        CLOUDINARY_API_SECRET: ${{ secrets.PROD_CLOUDINARY_API_SECRET }}
        # Add all production secrets
```

### Docker Configuration

#### Backend Dockerfile
```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/*.jar app.jar

# Environment variables will be passed at runtime
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose with Environment Variables
```yaml
version: '3.8'

services:
  backend:
    build: ./nomanweb_backend
    ports:
      - "8080:8080"
    env_file:
      - ./nomanweb_backend/.env
    depends_on:
      - postgres
      - redis
  
  frontend:
    build: ./nomanweb_frontend
    ports:
      - "3000:3000"
    env_file:
      - ./nomanweb_frontend/.env.local
    depends_on:
      - backend
  
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-nomanweb}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-2480}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## 📋 Deployment Checklist

### Before Going to Production:

1. **Security**:
   - [ ] Generate strong, unique secrets for production
   - [ ] Use separate Firebase projects for each environment
   - [ ] Set up separate LINE OAuth apps for each environment
   - [ ] Configure production databases with proper security
   - [ ] Set up SSL certificates

2. **Environment Variables**:
   - [ ] All `.env*` files are in `.gitignore`
   - [ ] Production secrets are stored securely (not in code)
   - [ ] Environment-specific configurations are tested
   - [ ] Logging levels are appropriate for each environment

3. **Infrastructure**:
   - [ ] Production database is set up and secured
   - [ ] Redis is configured for production
   - [ ] Typesense is set up for production
   - [ ] CDN is configured for static assets
   - [ ] Monitoring and alerting are set up

4. **CI/CD**:
   - [ ] Automated tests are passing
   - [ ] Deployment pipeline is configured
   - [ ] Rollback strategy is in place
   - [ ] Environment-specific deployments are working

## 🔧 Usage Instructions

### For Development:
1. Copy the development environment configurations to the respective `.env` files
2. Update the values according to your local setup
3. Run the applications normally

### For Production:
1. Set up your production infrastructure
2. Configure environment variables in your deployment platform
3. Use secrets management for sensitive values
4. Deploy using your CI/CD pipeline

### For Local Testing of Production Config:
1. Create `.env.production` files with production-like values
2. Use different database names and ports to avoid conflicts
3. Test the complete deployment process locally first

This setup provides a robust, secure, and scalable environment configuration that supports development, staging, and production deployments with proper CI/CD integration. 