# Nomanweb Load Testing Guide

This directory contains load testing tools and scripts for testing the Nomanweb application with 1000 concurrent users.

## 🎯 Testing Overview

The load testing setup includes:
- **Database optimizations** for high concurrency
- **JMeter test plan** for comprehensive load testing
- **Simple PowerShell scripts** for basic testing
- **Performance monitoring** and reporting

## 📋 Prerequisites

### For JMeter Testing (Recommended)
1. **Download Apache JMeter**: https://jmeter.apache.org/download_jmeter.cgi
2. **Extract to**: `C:\apache-jmeter\` (or update path in script)
3. **Java 8+** required for JMeter

### For Simple Testing
- PowerShell 5.0+ (included in Windows 10+)
- curl (included in Windows 10+)

## 🚀 Quick Start

### Option 1: JMeter Load Testing (Recommended)

```powershell
# Navigate to load testing directory
cd "c:\Users\saihe\Downloads\Senior Project 1\Nomanweb\load-testing"

# Run with default settings (1000 users)
.\run-load-test.ps1

# Run with custom parameters
.\run-load-test.ps1 -Users 500 -RampUp 120 -Duration 300
```

### Option 2: Simple Load Testing

```powershell
# Basic test with 100 concurrent users
.\simple-load-test.ps1

# Custom test
.\simple-load-test.ps1 -ConcurrentUsers 200 -RequestsPerUser 5
```

## 📊 Test Scenarios

### JMeter Test Plan Includes:
1. **User Registration** - Creates unique test users
2. **User Authentication** - Login and token extraction
3. **Story Operations** - Get stories, create stories
4. **Concurrent Access** - Simulates real user behavior
5. **Performance Metrics** - Response times, throughput, errors

### Endpoints Tested:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/stories` - Fetch stories (paginated)
- `POST /api/stories` - Create new stories
- `GET /api/stories/test` - Health check endpoint

## ⚙️ Configuration Changes Made

### Database Connection Pool (application.properties)
```properties
# Optimized for 1000 concurrent users
spring.datasource.hikari.maximum-pool-size=50
spring.datasource.hikari.minimum-idle=10
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.leak-detection-threshold=60000
```

### Server Performance Settings
```properties
# Tomcat thread pool optimization
server.tomcat.threads.max=200
server.tomcat.threads.min-spare=20
server.tomcat.max-connections=8192
server.tomcat.accept-count=100
server.tomcat.connection-timeout=20000

# JPA batch processing
spring.jpa.properties.hibernate.jdbc.batch_size=25
spring.jpa.properties.hibernate.order_inserts=true
spring.jpa.properties.hibernate.order_updates=true

# Redis connection pool
spring.data.redis.lettuce.pool.max-active=50
spring.data.redis.lettuce.pool.max-idle=25
spring.data.redis.lettuce.pool.min-idle=5
```

## 📈 Performance Metrics to Monitor

### Application Metrics
- **Response Time**: Average, 95th percentile, 99th percentile
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Concurrent Users**: Active user sessions

### System Metrics
- **CPU Usage**: Application and database server
- **Memory Usage**: Heap usage, garbage collection
- **Database Connections**: Active, idle, waiting
- **Network I/O**: Bandwidth utilization

### Database Metrics
- **Connection Pool**: Active/idle connections
- **Query Performance**: Slow queries, deadlocks
- **Transaction Rate**: Commits, rollbacks per second

## 🎯 Test Parameters

### Default JMeter Configuration
- **Users**: 1000 concurrent users
- **Ramp-up**: 300 seconds (5 minutes)
- **Duration**: 600 seconds (10 minutes)
- **Think Time**: 1-4 seconds between requests

### Customizable Parameters
```powershell
# JMeter parameters
-Users 1000          # Number of concurrent users
-RampUp 300          # Ramp-up time in seconds
-Duration 600        # Test duration in seconds
-ServerHost localhost # Target server
-ServerPort 8080     # Target port

# Simple test parameters
-ConcurrentUsers 100      # Concurrent PowerShell jobs
-RequestsPerUser 10       # Requests per user
-DelayBetweenRequests 1   # Delay in seconds
```

## 📋 Expected Results

### Performance Targets
- **Response Time**: < 2 seconds for 95% of requests
- **Throughput**: > 100 requests/second
- **Error Rate**: < 1%
- **Database Connections**: < 80% of pool capacity

### Warning Signs
- Response times > 5 seconds
- Error rates > 5%
- Database connection pool exhaustion
- Memory leaks or excessive GC

## 🔧 Troubleshooting

### Common Issues

1. **Connection Timeouts**
   - Increase `server.tomcat.connection-timeout`
   - Check network connectivity
   - Verify database availability

2. **Database Connection Pool Exhaustion**
   - Increase `spring.datasource.hikari.maximum-pool-size`
   - Check for connection leaks
   - Monitor long-running transactions

3. **High Memory Usage**
   - Increase JVM heap size: `-Xmx4g`
   - Monitor for memory leaks
   - Check garbage collection logs

4. **JMeter Issues**
   - Verify JMeter installation path
   - Check Java version compatibility
   - Ensure sufficient system resources

### Performance Tuning Tips

1. **Database Optimization**
   - Add indexes for frequently queried columns
   - Optimize slow queries
   - Consider read replicas for read-heavy operations

2. **Application Optimization**
   - Enable response compression
   - Implement caching strategies
   - Use async processing for heavy operations

3. **Infrastructure Scaling**
   - Horizontal scaling with load balancers
   - Database connection pooling
   - CDN for static content

## 📊 Results Analysis

### JMeter Reports
- **HTML Dashboard**: Comprehensive performance report
- **Response Times**: Detailed timing analysis
- **Throughput**: Requests per second over time
- **Error Analysis**: Failed request details

### Key Metrics to Review
1. **Average Response Time**: Should be < 2 seconds
2. **95th Percentile**: Should be < 5 seconds
3. **Error Rate**: Should be < 1%
4. **Throughput**: Target > 100 req/sec
5. **Resource Utilization**: CPU < 80%, Memory < 80%

## 🚨 Load Testing Best Practices

1. **Start Small**: Begin with 10-50 users, then scale up
2. **Monitor Resources**: Watch CPU, memory, database connections
3. **Test Realistic Scenarios**: Mix of read/write operations
4. **Gradual Ramp-up**: Don't hit the system all at once
5. **Test in Production-like Environment**: Similar hardware/network
6. **Clean Up**: Remove test data after testing

## 📞 Support

If you encounter issues:
1. Check the application logs
2. Monitor system resources
3. Review database performance
4. Analyze JMeter error logs
5. Consider reducing concurrent users if system is overwhelmed

---

**Note**: Always test in a non-production environment first. Load testing can impact system performance and should be coordinated with your team.