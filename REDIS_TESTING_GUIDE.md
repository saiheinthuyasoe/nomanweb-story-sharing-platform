# 🔍 Redis Testing Guide for NoManWeb Project

This guide explains how to verify that Redis is working correctly in both the backend and frontend of your NoManWeb project.

## 📋 **Current Redis Implementation Status**

### ✅ **Backend Redis (Fully Implemented)**
- **Configuration**: Redis is properly configured in `application.properties`
- **Dependencies**: Spring Boot Redis starter included in `pom.xml`
- **Services**: `CachedAuthService` uses Redis for user profile caching
- **Configuration**: `RedisConfig.java` provides proper serialization setup
- **Health Endpoints**: New Redis health check endpoints added

### ❌ **Frontend Redis (Not Directly Used)**
- **Architecture**: Frontend doesn't directly use Redis
- **Communication**: Frontend communicates with backend APIs, which use Redis
- **Caching**: Frontend uses browser caching and React Query, not Redis

---

## 🧪 **Testing Methods**

### **Method 1: Automated Testing Scripts**

#### **Linux/Mac (Bash Script)**
```bash
# Make script executable
chmod +x test_redis.sh

# Run the test script
./test_redis.sh

# With custom options
./test_redis.sh -u http://localhost:9000 -l custom_test.log
```

#### **Windows (Batch Script)**
```cmd
# Run the test script
test_redis.bat

# With custom backend URL
set BACKEND_URL=http://localhost:9000
test_redis.bat
```

### **Method 2: Frontend Testing Page**

1. **Start your applications:**
   ```bash
   # Backend (Terminal 1)
   cd nomanweb_backend
   mvn spring-boot:run

   # Frontend (Terminal 2)
   cd nomanweb_frontend
   npm run dev
   ```

2. **Access the Redis testing page:**
   ```
   http://localhost:3000/test-redis
   ```

3. **Run the tests:**
   - Click "Test Redis Health" to check basic connectivity
   - Click "Test Cache" to verify read/write operations
   - Click "Get Cache Stats" to view server information

### **Method 3: Manual API Testing**

#### **Health Check**
```bash
curl -X GET "http://localhost:8080/api/redis/health"
```

**Expected Response:**
```json
{
  "status": "UP",
  "message": "Redis is working correctly",
  "testValue": "Redis is working!",
  "timestamp": 1703123456789
}
```

#### **Cache Test**
```bash
curl -X POST "http://localhost:8080/api/redis/test-cache" \
  -H "Content-Type: application/json" \
  -d '{"key":"test:key:123","value":"Hello Redis!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "key": "test:key:123",
  "originalValue": "Hello Redis!",
  "retrievedValue": "Hello Redis!",
  "matches": true,
  "timestamp": 1703123456789
}
```

#### **Cache Stats**
```bash
curl -X GET "http://localhost:8080/api/redis/cache-stats"
```

**Expected Response:**
```json
{
  "success": true,
  "redisInfo": "Redis server information...",
  "timestamp": 1703123456789
}
```

### **Method 4: Redis CLI Testing**

#### **Direct Redis Connection**
```bash
# Test Redis connectivity
redis-cli ping
# Expected: PONG

# Test basic operations
redis-cli set "test:key" "test:value"
redis-cli get "test:key"
redis-cli del "test:key"
```

#### **Redis Info**
```bash
# Get Redis server information
redis-cli info

# Get memory usage
redis-cli info memory

# Get client connections
redis-cli info clients
```

---

## 🔧 **Setup Requirements**

### **1. Redis Server Installation**

#### **Using Docker (Recommended)**
```bash
# Start Redis container
docker run -d -p 6379:6379 --name redis redis:alpine

# Check if Redis is running
docker ps | grep redis
```

#### **Direct Installation**

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
```bash
# Download from https://redis.io/download
# Or use WSL2 with Ubuntu
```

### **2. Backend Configuration**

Ensure your `application.properties` has Redis configuration:
```properties
# Redis Configuration
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=
spring.data.redis.timeout=60000ms
spring.data.redis.lettuce.pool.max-active=8
spring.data.redis.lettuce.pool.max-idle=8
spring.data.redis.lettuce.pool.min-idle=0
```

### **3. Frontend Configuration**

Ensure your `.env.local` has the backend URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

---

## 📊 **What Gets Tested**

### **1. Backend Redis Tests**
- ✅ **Connectivity**: Can the backend connect to Redis?
- ✅ **Health Check**: Basic Redis operations (set/get/delete)
- ✅ **Cache Operations**: Read/write operations with TTL
- ✅ **Server Stats**: Redis server information retrieval
- ✅ **CachedAuthService**: User profile caching functionality
- ✅ **Performance**: Response time for multiple operations

### **2. Frontend Integration Tests**
- ✅ **API Communication**: Frontend can reach Redis endpoints
- ✅ **Error Handling**: Proper error responses
- ✅ **UI Feedback**: Visual indicators for test results
- ✅ **Real-time Updates**: Dynamic test result display

### **3. Redis CLI Tests**
- ✅ **Direct Connection**: Redis CLI connectivity
- ✅ **Basic Operations**: Set, get, delete operations
- ✅ **Server Info**: Redis server statistics

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Redis Connection Failed**
```bash
# Check if Redis is running
redis-cli ping
# If not responding, start Redis:
docker start redis
# or
sudo systemctl start redis-server
```

#### **2. Backend Not Accessible**
```bash
# Check if Spring Boot is running
curl http://localhost:8080/actuator/health
# If not responding, start the backend:
cd nomanweb_backend
mvn spring-boot:run
```

#### **3. Frontend Not Loading**
```bash
# Check if Next.js is running
curl http://localhost:3000
# If not responding, start the frontend:
cd nomanweb_frontend
npm run dev
```

#### **4. CORS Issues**
Ensure your backend CORS configuration allows frontend requests:
```properties
app.cors.allowed-origins=http://localhost:3000,http://localhost:3001
```

### **Debug Commands**

#### **Check Redis Status**
```bash
# Docker
docker logs redis

# System service
sudo systemctl status redis-server

# Direct connection
redis-cli info server
```

#### **Check Backend Logs**
```bash
# Look for Redis-related logs
tail -f nomanweb_backend/logs/application.log | grep -i redis
```

#### **Check Network Connectivity**
```bash
# Test Redis port
telnet localhost 6379

# Test backend port
telnet localhost 8080

# Test frontend port
telnet localhost 3000
```

---

## 📈 **Performance Monitoring**

### **Redis Performance Metrics**
```bash
# Monitor Redis performance
redis-cli info stats

# Monitor memory usage
redis-cli info memory

# Monitor client connections
redis-cli info clients
```

### **Application Performance**
- **Cache Hit Rate**: Monitor how often data is served from cache
- **Response Times**: Compare cached vs non-cached responses
- **Memory Usage**: Monitor Redis memory consumption
- **Connection Pool**: Check connection pool utilization

---

## 🔍 **Advanced Testing**

### **Load Testing**
```bash
# Test with multiple concurrent requests
for i in {1..100}; do
  curl -X POST "http://localhost:8080/api/redis/test-cache" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"load:test:$i\",\"value\":\"Load test $i\"}" &
done
wait
```

### **Stress Testing**
```bash
# Use Apache Bench for stress testing
ab -n 1000 -c 10 -p test_data.json -T application/json \
  http://localhost:8080/api/redis/test-cache
```

### **Memory Testing**
```bash
# Fill Redis with test data
for i in {1..10000}; do
  redis-cli set "stress:key:$i" "value:$i"
done

# Check memory usage
redis-cli info memory
```

---

## 📋 **Test Results Interpretation**

### **✅ Success Indicators**
- All health checks return "UP"
- Cache operations return "success: true"
- Values match between set and get operations
- Response times under 100ms for cache operations
- No connection errors in logs

### **❌ Failure Indicators**
- Health checks return "DOWN"
- Cache operations return "success: false"
- Values don't match between set and get operations
- High response times (>500ms)
- Connection timeout errors

### **⚠️ Warning Indicators**
- Slow response times (100-500ms)
- High memory usage (>80% of available)
- Many connection errors in logs
- Cache miss rates >50%

---

## 🎯 **Next Steps**

### **If Tests Pass**
1. ✅ Redis is working correctly
2. ✅ You can use the caching features
3. ✅ Monitor performance in production
4. ✅ Consider scaling Redis for high load

### **If Tests Fail**
1. ❌ Check Redis server status
2. ❌ Verify network connectivity
3. ❌ Check configuration files
4. ❌ Review application logs
5. ❌ Ensure all dependencies are installed

### **Performance Optimization**
1. 🚀 Adjust Redis configuration for your use case
2. 🚀 Implement cache warming strategies
3. 🚀 Monitor cache hit rates
4. 🚀 Optimize TTL settings
5. 🚀 Consider Redis clustering for high availability

---

## 📞 **Support**

If you encounter issues:
1. Check the log files generated by the test scripts
2. Review the troubleshooting section above
3. Check Redis and Spring Boot documentation
4. Verify all prerequisites are met
5. Ensure network connectivity between services

---

**🎉 Happy Testing! Your Redis implementation is ready for production use.** 