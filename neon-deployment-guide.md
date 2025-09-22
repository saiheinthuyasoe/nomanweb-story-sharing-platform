# Neon PostgreSQL Deployment Guide

## 🚀 Step 1: Create Neon Project

1. Go to [neon.tech](https://neon.tech) and sign up/login
2. Click "Create Project"
3. Fill in project details:
   - **Name**: `nomanweb-database`
   - **Database name**: `nomanweb` (or keep default)
   - **Region**: Choose closest to your users
4. Click "Create Project"

## 🔗 Step 2: Get Database Connection Details

After project creation, go to your project dashboard:

- **Host**: `[endpoint].neon.tech`
- **Database name**: `nomanweb` (or your chosen name)
- **Port**: `5432`
- **User**: Your Neon username
- **Password**: Your Neon password

Your connection string will look like:

```
jdbc:postgresql://[endpoint].neon.tech:5432/[database]?sslmode=require
```

## ⚙️ Step 3: Update Environment Variables

### For Local Development (.env file):

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://[endpoint].neon.tech:5432/[database]?sslmode=require
SPRING_DATASOURCE_USERNAME=[your-neon-username]
SPRING_DATASOURCE_PASSWORD=[your-neon-password]
```

### For Production Deployment:

Set these environment variables in your hosting platform:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

## 📊 Step 4: Database Migration

### Option A: Automatic Migration (Recommended for Development)

The application is configured with `spring.jpa.hibernate.ddl-auto=update`, so tables will be created automatically when you start the application.

### Option B: Manual Migration (Recommended for Production)

1. Export your current database schema:

   ```bash
   pg_dump -h localhost -U postgres -d nomanweb --schema-only > schema.sql
   ```

2. Export your data:

   ```bash
   pg_dump -h localhost -U postgres -d nomanweb --data-only > data.sql
   ```

3. Connect to Neon and run the SQL files:
   - Use Neon SQL Editor or any PostgreSQL client
   - Run `schema.sql` first, then `data.sql`

## 🔧 Step 5: Create Admin Account

Run the admin creation script in Neon SQL Editor:

```sql
INSERT INTO users (
    id, email, username, password_hash, role, email_verified,
    coin_balance, total_earned_coins, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'superadmin@nomanweb.com',
    'superadmin',
    '$2a$10$GJ2n.EfFPRAnsHdglYwJd.jFq5NjMnKYc/iCn8YIs/ge/xCbbQTJe',
    'ADMIN',
    true,
    0.00,
    0.00,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;
```

## 🧪 Step 6: Test Connection

1. Update your environment variables
2. Start your Spring Boot application
3. Check the logs for successful database connection
4. Test login with the admin account:
   - Email: `superadmin@nomanweb.com`
   - Password: `admin123` (default password)

## 🔒 Security Considerations

1. **Change Default Passwords**: Update the admin password after first login
2. **Environment Variables**: Never commit database credentials to version control
3. **SSL**: Neon enforces SSL by default (sslmode=require)
4. **Connection Pooling**: The application is configured with HikariCP for optimal performance
5. **Neon Security**: Neon provides built-in security features including IP allowlisting

## 📈 Monitoring

- **Neon Dashboard**: Monitor database performance, usage, and metrics
- **Application Logs**: Check Spring Boot logs for connection issues
- **Health Checks**: The application includes database health checks

## 🚨 Troubleshooting

### Connection Issues:

- Verify the connection string format
- Check if your IP is allowed in Neon settings
- Ensure SSL is enabled in the connection string
- Verify your Neon project is not suspended

### Migration Issues:

- Check table names and constraints
- Verify data types compatibility
- Review foreign key relationships

### Performance Issues:

- Monitor connection pool settings
- Check query performance in Neon dashboard
- Consider adding database indexes for frequently queried columns
- Review Neon compute settings

## 📝 Next Steps

1. Set up database backups (Neon provides automatic backups)
2. Configure monitoring and alerts in Neon dashboard
3. Set up staging environment with separate Neon project
4. Consider implementing database migrations with Flyway or Liquibase for production
5. Review Neon's branching feature for development workflows
