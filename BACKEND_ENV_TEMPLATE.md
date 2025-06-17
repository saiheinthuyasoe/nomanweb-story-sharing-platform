# NoManWeb Backend Environment Configuration

## Environment Variables Template

Copy the contents below to create `.env` files for different environments:

### Development Environment (`.env` or `.env.development`)

```bash
# =============================================================================
# NoManWeb Backend Environment Configuration - DEVELOPMENT
# =============================================================================

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080
SPRING_APPLICATION_NAME=nomanweb-backend

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/nomanweb
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=2480
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver

# JPA/Hibernate Configuration
SPRING_JPA_HIBERNATE_DDL_AUTO=update
SPRING_JPA_SHOW_SQL=true
SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect
SPRING_JPA_GENERATE_DDL=true

# =============================================================================
# REDIS CONFIGURATION
# =============================================================================
SPRING_DATA_REDIS_HOST=localhost
SPRING_DATA_REDIS_PORT=6379
SPRING_DATA_REDIS_TIMEOUT=60000ms
SPRING_DATA_REDIS_LETTUCE_POOL_MAX_ACTIVE=8
SPRING_DATA_REDIS_LETTUCE_POOL_MAX_IDLE=8
SPRING_DATA_REDIS_LETTUCE_POOL_MIN_IDLE=0

# =============================================================================
# TYPESENSE CONFIGURATION
# =============================================================================
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=d4b1a1f3-e5c2-4a8d-9f7b-6c3a9e8d2f1a
TYPESENSE_CONNECTION_TIMEOUT=5000
TYPESENSE_READ_TIMEOUT=5000

# =============================================================================
# JWT CONFIGURATION
# =============================================================================
APP_JWT_SECRET=your-256-bit-secret-key-here-make-it-very-long-and-secure-for-production
APP_JWT_EXPIRATION=86400000
APP_JWT_REFRESH_EXPIRATION=604800000

# =============================================================================
# FILE UPLOAD CONFIGURATION
# =============================================================================
SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE=10MB
SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE=10MB

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=saiheinthuyasoe@gmail.com
SPRING_MAIL_PASSWORD=stnp gloa vqsv aovw
SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true

# =============================================================================
# CLOUDINARY CONFIGURATION
# =============================================================================
CLOUDINARY_CLOUD_NAME=dou5xwcdi
CLOUDINARY_API_KEY=591472543194672
CLOUDINARY_API_SECRET=ui3Qg137HrclpxOswV4ZM8GazZk

# =============================================================================
# LINE BOT CONFIGURATION
# =============================================================================
LINE_BOT_CHANNEL_TOKEN=cjjfkSqIMuc7ya/q/AJhLF94FkoZ3g2Wu2tnqYA0ts4JCkNu6YQS3LfZGnpJXJPlug2tg3GimZRy2pYfH3Xj8cyo0plfUqX/wPhLp0NmvqfaN3h5/VYILPMHZCi2UrNIN2J3xSGEQO8zkCzx1GM+GgdB04t89/1O/w1cDnyilFU=
LINE_BOT_CHANNEL_SECRET=54224a25944c0d83237e9b1e0c36686d

# =============================================================================
# LINE OAUTH CONFIGURATION
# =============================================================================
LINE_CHANNEL_ID=2007499018
LINE_CHANNEL_SECRET=fde2263703ef7429ba83b5d1daa5b9de
LINE_CALLBACK_URL=http://localhost:3000/auth/line/callback

# =============================================================================
# APPLICATION SETTINGS
# =============================================================================
APP_FRONTEND_URL=http://localhost:3000
APP_EMAIL_FROM=saiheinthuyasoe@gmail.com
APP_EMAIL_VERIFICATION_EXPIRY=48
APP_PASSWORD_RESET_EXPIRY=24

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
APP_CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
APP_CORS_ALLOWED_HEADERS=*
APP_CORS_ALLOW_CREDENTIALS=true

# =============================================================================
# FIREBASE CONFIGURATION
# =============================================================================
FIREBASE_SERVICE_ACCOUNT_KEY=firebase-service-account.json

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
SECURITY_RATE_LIMIT_LOGIN_ATTEMPTS=5
SECURITY_RATE_LIMIT_LOGIN_WINDOW=60
SECURITY_RATE_LIMIT_REGISTRATION_ATTEMPTS=3
SECURITY_RATE_LIMIT_REGISTRATION_WINDOW=3600
SECURITY_RATE_LIMIT_PASSWORD_RESET_ATTEMPTS=3
SECURITY_RATE_LIMIT_PASSWORD_RESET_WINDOW=3600

# =============================================================================
# LOGGING CONFIGURATION (DEBUG for development)
# =============================================================================
LOGGING_LEVEL_COM_APP_NOMANWEB_BACKEND=DEBUG
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_SECURITY=DEBUG
LOGGING_LEVEL_ORG_HIBERNATE_SQL=DEBUG
LOGGING_LEVEL_ORG_HIBERNATE_TYPE_DESCRIPTOR_SQL_BASICBINDER=TRACE
LOGGING_LEVEL_ORG_HIBERNATE_TOOL_HBM2DDL=DEBUG
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_ORM_JPA=DEBUG

# =============================================================================
# ACTUATOR CONFIGURATION
# =============================================================================
MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info,metrics
MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS=when-authorized
```

### Production Environment (`.env.production`)

```bash
# =============================================================================
# NoManWeb Backend Environment Configuration - PRODUCTION
# =============================================================================

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080
SPRING_APPLICATION_NAME=nomanweb-backend

# =============================================================================
# DATABASE CONFIGURATION (Use your production database)
# =============================================================================
SPRING_DATASOURCE_URL=jdbc:postgresql://your-prod-db-host:5432/nomanweb_prod
SPRING_DATASOURCE_USERNAME=your_prod_db_user
SPRING_DATASOURCE_PASSWORD=your_strong_prod_db_password
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver

# JPA/Hibernate Configuration (More conservative for production)
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_JPA_SHOW_SQL=false
SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.PostgreSQLDialect
SPRING_JPA_GENERATE_DDL=false

# =============================================================================
# REDIS CONFIGURATION (Use your production Redis)
# =============================================================================
SPRING_DATA_REDIS_HOST=your-prod-redis-host
SPRING_DATA_REDIS_PORT=6379
SPRING_DATA_REDIS_PASSWORD=your_redis_password
SPRING_DATA_REDIS_TIMEOUT=60000ms
SPRING_DATA_REDIS_LETTUCE_POOL_MAX_ACTIVE=8
SPRING_DATA_REDIS_LETTUCE_POOL_MAX_IDLE=8
SPRING_DATA_REDIS_LETTUCE_POOL_MIN_IDLE=0

# =============================================================================
# TYPESENSE CONFIGURATION (Use your production Typesense)
# =============================================================================
TYPESENSE_HOST=your-prod-typesense-host
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=your_production_typesense_api_key
TYPESENSE_CONNECTION_TIMEOUT=5000
TYPESENSE_READ_TIMEOUT=5000

# =============================================================================
# JWT CONFIGURATION (Use strong secrets for production)
# =============================================================================
APP_JWT_SECRET=your-very-strong-256-bit-secret-key-for-production-use-random-generator
APP_JWT_EXPIRATION=86400000
APP_JWT_REFRESH_EXPIRATION=604800000

# =============================================================================
# FILE UPLOAD CONFIGURATION
# =============================================================================
SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE=10MB
SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE=10MB

# =============================================================================
# EMAIL CONFIGURATION (Use your production email service)
# =============================================================================
SPRING_MAIL_HOST=your-smtp-host
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your_production_email@yourdomain.com
SPRING_MAIL_PASSWORD=your_production_email_password
SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true

# =============================================================================
# CLOUDINARY CONFIGURATION (Your production Cloudinary account)
# =============================================================================
CLOUDINARY_CLOUD_NAME=your_production_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_production_cloudinary_api_key
CLOUDINARY_API_SECRET=your_production_cloudinary_api_secret

# =============================================================================
# LINE BOT CONFIGURATION (Your production LINE Bot)
# =============================================================================
LINE_BOT_CHANNEL_TOKEN=your_production_line_bot_channel_token
LINE_BOT_CHANNEL_SECRET=your_production_line_bot_channel_secret

# =============================================================================
# LINE OAUTH CONFIGURATION (Your production LINE OAuth)
# =============================================================================
LINE_CHANNEL_ID=your_production_line_channel_id
LINE_CHANNEL_SECRET=your_production_line_channel_secret
LINE_CALLBACK_URL=https://yourdomain.com/auth/line/callback

# =============================================================================
# APPLICATION SETTINGS (Your production domain)
# =============================================================================
APP_FRONTEND_URL=https://yourdomain.com
APP_EMAIL_FROM=noreply@yourdomain.com
APP_EMAIL_VERIFICATION_EXPIRY=48
APP_PASSWORD_RESET_EXPIRY=24

# =============================================================================
# CORS CONFIGURATION (Your production domains)
# =============================================================================
APP_CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
APP_CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
APP_CORS_ALLOWED_HEADERS=*
APP_CORS_ALLOW_CREDENTIALS=true

# =============================================================================
# FIREBASE CONFIGURATION
# =============================================================================
FIREBASE_SERVICE_ACCOUNT_KEY=firebase-service-account-prod.json

# =============================================================================
# SECURITY CONFIGURATION (More restrictive for production)
# =============================================================================
SECURITY_RATE_LIMIT_LOGIN_ATTEMPTS=3
SECURITY_RATE_LIMIT_LOGIN_WINDOW=300
SECURITY_RATE_LIMIT_REGISTRATION_ATTEMPTS=2
SECURITY_RATE_LIMIT_REGISTRATION_WINDOW=3600
SECURITY_RATE_LIMIT_PASSWORD_RESET_ATTEMPTS=2
SECURITY_RATE_LIMIT_PASSWORD_RESET_WINDOW=3600

# =============================================================================
# LOGGING CONFIGURATION (INFO level for production)
# =============================================================================
LOGGING_LEVEL_COM_APP_NOMANWEB_BACKEND=INFO
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_SECURITY=WARN
LOGGING_LEVEL_ORG_HIBERNATE_SQL=WARN
LOGGING_LEVEL_ORG_HIBERNATE_TYPE_DESCRIPTOR_SQL_BASICBINDER=WARN
LOGGING_LEVEL_ORG_HIBERNATE_TOOL_HBM2DDL=WARN
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_ORM_JPA=WARN

# =============================================================================
# ACTUATOR CONFIGURATION (More secure for production)
# =============================================================================
MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE=health,info
MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS=never
```

## Instructions

1. **For Development**: Copy the development configuration to `nomanweb_backend/.env`
2. **For Production**: Copy the production configuration to `nomanweb_backend/.env.production`
3. **For Staging**: Create a `.env.staging` with values between development and production
4. Update the `application.properties` file to use environment variables instead of hardcoded values
5. Make sure to add `.env*` files to your `.gitignore` to avoid committing sensitive information 