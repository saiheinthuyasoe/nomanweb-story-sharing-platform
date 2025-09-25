# Render Deployment Guide for Nomanweb Backend

This guide will help you deploy the Nomanweb Spring Boot backend application to Render.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Database**: PostgreSQL database (can use Render PostgreSQL or external like Neon)
4. **Redis**: Redis instance (can use Render Redis or external)
5. **External Services**: Configured accounts for:
   - Cloudinary (image storage)
   - Gmail (email service)
   - Stripe (payments)
   - Firebase (authentication)
   - Typesense (search)
   - LINE Bot (messaging)

## Deployment Steps

### 1. Connect Your Repository

1. Log in to your Render dashboard
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository containing the backend code
4. Select the repository and branch (usually `main` or `master`)

### 2. Configure Build Settings

Render will automatically detect the `render.yaml` file and use it for configuration. If you prefer manual setup:

- **Name**: `nomanweb-backend`
- **Environment**: `Java`
- **Build Command**: `./mvnw clean package -DskipTests`
- **Start Command**: `java -Dserver.port=$PORT -jar target/nomanweb_backend-0.0.1-SNAPSHOT.jar`

### 3. Set Environment Variables

In your Render service dashboard, go to "Environment" and add the following variables:

#### Required Database Variables
```
SPRING_DATASOURCE_URL=jdbc:postgresql://your-db-host:5432/your-db-name?sslmode=require
SPRING_DATASOURCE_USERNAME=your-db-username
SPRING_DATASOURCE_PASSWORD=your-db-password
```

#### Required Redis Variables
```
SPRING_DATA_REDIS_HOST=your-redis-host
SPRING_DATA_REDIS_PORT=6379
SPRING_DATA_REDIS_PASSWORD=your-redis-password
```

#### Required JWT Configuration
```
APP_JWT_SECRET=your-very-long-and-secure-jwt-secret-key-at-least-256-bits
APP_JWT_EXPIRATION=900000
APP_JWT_REFRESH_EXPIRATION=604800000
```

#### Required Email Configuration
```
SPRING_MAIL_USERNAME=your-gmail-address@gmail.com
SPRING_MAIL_PASSWORD=your-gmail-app-password
APP_EMAIL_FROM=your-gmail-address@gmail.com
```

#### Required Cloudinary Configuration
```
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

#### Required Frontend URL
```
APP_FRONTEND_URL=https://your-frontend-domain.com
APP_CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
```

#### Required Typesense Configuration
```
TYPESENSE_HOST=your-typesense-host
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=your-typesense-api-key
```

#### Optional but Recommended Variables

**Stripe Configuration** (for payments):
```
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_SUCCESS_URL=https://your-frontend-domain.com/payment/success
STRIPE_CANCEL_URL=https://your-frontend-domain.com/payment/cancel
```

**LINE Bot Configuration** (for messaging):
```
LINE_BOT_CHANNEL_TOKEN=your-line-bot-channel-token
LINE_BOT_CHANNEL_SECRET=your-line-bot-channel-secret
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-oauth-channel-secret
LINE_CALLBACK_URL=https://your-frontend-domain.com/auth/line/callback
```

**Firebase Configuration** (for Google OAuth):
```
FIREBASE_SERVICE_ACCOUNT_KEY=firebase-service-account.json
```

### 4. Upload Firebase Service Account Key (if using Firebase)

1. In your Render service, go to "Settings"
2. Scroll down to "Secret Files"
3. Add a new secret file:
   - **Filename**: `firebase-service-account.json`
   - **Contents**: Paste your Firebase service account JSON content

### 5. Configure Health Check

The application includes health check endpoints at `/actuator/health`. Render will automatically use this for health monitoring.

### 6. Deploy

1. Click "Create Web Service"
2. Render will start building and deploying your application
3. Monitor the build logs for any errors
4. Once deployed, your service will be available at `https://your-service-name.onrender.com`

## Database Setup

### Option 1: Using Render PostgreSQL

1. In Render dashboard, create a new PostgreSQL database
2. Use the connection details provided by Render for your environment variables

### Option 2: Using External Database (e.g., Neon)

1. Create a database on your preferred provider
2. Use the connection string in your `SPRING_DATASOURCE_URL` variable

### Database Migration

The application is configured to automatically update the database schema on startup (`spring.jpa.hibernate.ddl-auto=update` in development, `validate` in production).

For production, it's recommended to:
1. Set `SPRING_JPA_HIBERNATE_DDL_AUTO=validate`
2. Run database migrations manually using tools like Flyway or Liquibase

## Redis Setup

### Option 1: Using Render Redis

1. In Render dashboard, create a new Redis instance
2. Use the connection details for your environment variables

### Option 2: Using External Redis

1. Create a Redis instance on your preferred provider (e.g., Redis Cloud, AWS ElastiCache)
2. Use the connection details in your environment variables

## Monitoring and Logs

1. **Logs**: View real-time logs in the Render dashboard under "Logs"
2. **Metrics**: Monitor CPU, memory, and response times in the "Metrics" tab
3. **Health Check**: The application exposes health endpoints at `/actuator/health`

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that Java 17 is being used
   - Ensure all dependencies are properly defined in `pom.xml`
   - Verify Maven wrapper permissions: `chmod +x mvnw`

2. **Database Connection Issues**:
   - Verify database URL format and SSL requirements
   - Check database credentials
   - Ensure database is accessible from Render's IP ranges

3. **Memory Issues**:
   - Consider upgrading to a paid plan for more memory
   - Optimize JVM settings if needed

4. **Environment Variable Issues**:
   - Double-check all required environment variables are set
   - Ensure no typos in variable names
   - Verify sensitive values are properly escaped

### Performance Optimization

1. **JVM Settings**: Add JVM optimization flags to the start command:
   ```
   java -Xmx512m -Xms256m -Dserver.port=$PORT -jar target/nomanweb_backend-0.0.1-SNAPSHOT.jar
   ```

2. **Database Connection Pool**: Adjust Hikari connection pool settings based on your plan:
   ```
   SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=10
   SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE=2
   ```

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **HTTPS**: Render provides HTTPS by default
3. **CORS**: Configure CORS properly for your frontend domain
4. **Rate Limiting**: The application includes built-in rate limiting
5. **JWT Secret**: Use a strong, unique JWT secret for production

## Scaling

Render offers automatic scaling options:
1. **Horizontal Scaling**: Add more instances (paid plans)
2. **Vertical Scaling**: Upgrade to higher memory/CPU plans
3. **Database Scaling**: Use connection pooling and read replicas

## Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Spring Boot Documentation**: [spring.io/projects/spring-boot](https://spring.io/projects/spring-boot)
- **Application Logs**: Check Render dashboard logs for debugging

## Next Steps

After successful deployment:
1. Test all API endpoints
2. Verify database connectivity
3. Test email functionality
4. Configure monitoring and alerts
5. Set up CI/CD pipeline for automatic deployments
6. Configure backup strategies for your database