# NoManWeb Frontend Environment Configuration

## Environment Variables Template

Copy the contents below to create `.env` files for different environments:

### Development Environment (`.env.local` or `.env.development`)

```bash
# =============================================================================
# NoManWeb Frontend Environment Configuration - DEVELOPMENT
# =============================================================================

# =============================================================================
# API CONFIGURATION
# =============================================================================
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# =============================================================================
# FIREBASE CONFIGURATION
# =============================================================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCZmt2rv6mRCa5as6ja39lbN7OR5m5O2E8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=nomanweb-ssp.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=nomanweb-ssp
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=nomanweb-ssp.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=178736588876
NEXT_PUBLIC_FIREBASE_APP_ID=1:178736588876:web:7d707f671e61cca5526ce9
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-GRSV3JGZZP

# =============================================================================
# LINE OAUTH CONFIGURATION
# =============================================================================
NEXT_PUBLIC_LINE_CHANNEL_ID=2007499018
NEXT_PUBLIC_LINE_CHANNEL_SECRET=fde2263703ef7429ba83b5d1daa5b9de
NEXT_PUBLIC_LINE_CALLBACK_URL=http://localhost:3000/auth/line/callback

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=NoManWeb
NEXT_PUBLIC_APP_DESCRIPTION=Story Sharing Platform

# =============================================================================
# DEVELOPMENT SETTINGS
# =============================================================================
NODE_ENV=development
```

### Production Environment (`.env.production`)

```bash
# =============================================================================
# NoManWeb Frontend Environment Configuration - PRODUCTION
# =============================================================================

# =============================================================================
# API CONFIGURATION (Your production backend URL)
# =============================================================================
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

# =============================================================================
# FIREBASE CONFIGURATION (Your production Firebase project)
# =============================================================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-production-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-production-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-production-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_production_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_production_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_production_measurement_id

# =============================================================================
# LINE OAUTH CONFIGURATION (Your production LINE OAuth app)
# =============================================================================
NEXT_PUBLIC_LINE_CHANNEL_ID=your_production_line_channel_id
NEXT_PUBLIC_LINE_CHANNEL_SECRET=your_production_line_channel_secret
NEXT_PUBLIC_LINE_CALLBACK_URL=https://yourdomain.com/auth/line/callback

# =============================================================================
# APPLICATION CONFIGURATION (Your production domain)
# =============================================================================
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=NoManWeb
NEXT_PUBLIC_APP_DESCRIPTION=Story Sharing Platform

# =============================================================================
# PRODUCTION SETTINGS
# =============================================================================
NODE_ENV=production
```

### Staging Environment (`.env.staging`)

```bash
# =============================================================================
# NoManWeb Frontend Environment Configuration - STAGING
# =============================================================================

# =============================================================================
# API CONFIGURATION (Your staging backend URL)
# =============================================================================
NEXT_PUBLIC_API_URL=https://staging-api.yourdomain.com/api

# =============================================================================
# FIREBASE CONFIGURATION (Your staging Firebase project)
# =============================================================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_staging_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-staging-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-staging-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-staging-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_staging_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_staging_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_staging_measurement_id

# =============================================================================
# LINE OAUTH CONFIGURATION (Your staging LINE OAuth app)
# =============================================================================
NEXT_PUBLIC_LINE_CHANNEL_ID=your_staging_line_channel_id
NEXT_PUBLIC_LINE_CHANNEL_SECRET=your_staging_line_channel_secret
NEXT_PUBLIC_LINE_CALLBACK_URL=https://staging.yourdomain.com/auth/line/callback

# =============================================================================
# APPLICATION CONFIGURATION (Your staging domain)
# =============================================================================
NEXT_PUBLIC_APP_URL=https://staging.yourdomain.com
NEXT_PUBLIC_APP_NAME=NoManWeb (Staging)
NEXT_PUBLIC_APP_DESCRIPTION=Story Sharing Platform - Staging Environment

# =============================================================================
# STAGING SETTINGS
# =============================================================================
NODE_ENV=staging
```

## Environment Variable Priorities in Next.js

Next.js loads environment variables in the following order (highest priority first):

1. `.env.local` (always loaded, should be in `.gitignore`)
2. `.env.production` (loaded when NODE_ENV=production)
3. `.env.staging` (loaded when NODE_ENV=staging)
4. `.env.development` (loaded when NODE_ENV=development)
5. `.env` (default, loaded in all environments)

## Important Notes

### For Frontend (Next.js):
- All environment variables that need to be accessible in the browser must be prefixed with `NEXT_PUBLIC_`
- Variables without `NEXT_PUBLIC_` prefix are only available server-side
- Never put sensitive information in `NEXT_PUBLIC_` variables as they are exposed to the client

### Security Considerations:
- **Never commit `.env` files with real credentials to version control**
- Add all `.env*` files to your `.gitignore` (except `.env.example`)
- Use different Firebase projects for different environments
- Use different LINE OAuth apps for different environments
- Rotate secrets regularly in production

## Instructions

1. **For Development**: Copy the development configuration to `nomanweb_frontend/.env.local`
2. **For Production**: Copy the production configuration to your deployment environment
3. **For Staging**: Create a `.env.staging` with values between development and production
4. Make sure to add `.env*` files to your `.gitignore` to avoid committing sensitive information

## Recommended File Structure

```
nomanweb_frontend/
├── .env.example           # Template with dummy values (commit this)
├── .env.local            # Development overrides (never commit)
├── .env.development      # Development defaults (never commit)
├── .env.staging          # Staging configuration (never commit)
├── .env.production       # Production configuration (never commit)
└── .gitignore            # Should include: .env*
``` 