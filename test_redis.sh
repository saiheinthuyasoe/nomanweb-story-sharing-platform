#!/bin/bash

# Redis Testing Script for NoManWeb Project
# This script tests Redis connectivity and functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL=${BACKEND_URL:-"http://localhost:8080"}
LOG_FILE="redis_test_$(date +%Y%m%d_%H%M%S).log"

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Test functions
test_redis_health() {
    log "Testing Redis health endpoint..."
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/redis_health.json \
        "$BACKEND_URL/api/redis/health" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        local status=$(jq -r '.status' /tmp/redis_health.json 2>/dev/null || echo "UNKNOWN")
        local message=$(jq -r '.message' /tmp/redis_health.json 2>/dev/null || echo "No message")
        
        if [ "$status" = "UP" ]; then
            success "Redis health check passed: $message"
            return 0
        else
            error "Redis health check failed: $message"
            return 1
        fi
    else
        error "Redis health endpoint returned HTTP $response"
        return 1
    fi
}

test_redis_cache() {
    log "Testing Redis cache operations..."
    
    local test_key="test:cache:$(date +%s)"
    local test_value="Hello Redis from $(date)"
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/redis_cache.json \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"key\":\"$test_key\",\"value\":\"$test_value\"}" \
        "$BACKEND_URL/api/redis/test-cache" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        local success=$(jq -r '.success' /tmp/redis_cache.json 2>/dev/null || echo "false")
        local matches=$(jq -r '.matches' /tmp/redis_cache.json 2>/dev/null || echo "false")
        
        if [ "$success" = "true" ] && [ "$matches" = "true" ]; then
            success "Redis cache test passed: Read/write operations working"
            return 0
        else
            error "Redis cache test failed: Values don't match"
            return 1
        fi
    else
        error "Redis cache endpoint returned HTTP $response"
        return 1
    fi
}

test_redis_stats() {
    log "Testing Redis stats endpoint..."
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/redis_stats.json \
        "$BACKEND_URL/api/redis/cache-stats" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        local success=$(jq -r '.success' /tmp/redis_stats.json 2>/dev/null || echo "false")
        
        if [ "$success" = "true" ]; then
            success "Redis stats test passed: Server information retrieved"
            return 0
        else
            error "Redis stats test failed"
            return 1
        fi
    else
        error "Redis stats endpoint returned HTTP $response"
        return 1
    fi
}

test_redis_cli() {
    log "Testing Redis CLI connectivity..."
    
    if command -v redis-cli >/dev/null 2>&1; then
        if redis-cli ping >/dev/null 2>&1; then
            success "Redis CLI connectivity: OK"
            
            # Test basic operations
            local test_key="cli:test:$(date +%s)"
            local test_value="CLI test value"
            
            redis-cli set "$test_key" "$test_value" >/dev/null 2>&1
            local retrieved=$(redis-cli get "$test_key" 2>/dev/null)
            redis-cli del "$test_key" >/dev/null 2>&1
            
            if [ "$retrieved" = "$test_value" ]; then
                success "Redis CLI operations: OK"
                return 0
            else
                error "Redis CLI operations: Failed"
                return 1
            fi
        else
            error "Redis CLI connectivity: Failed"
            return 1
        fi
    else
        warning "Redis CLI not found - skipping CLI tests"
        return 0
    fi
}

test_backend_connection() {
    log "Testing backend connectivity..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        "$BACKEND_URL/actuator/health" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        success "Backend connectivity: OK"
        return 0
    else
        error "Backend connectivity: Failed (HTTP $response)"
        return 1
    fi
}

test_cached_auth_service() {
    log "Testing CachedAuthService functionality..."
    
    # This would require authentication, so we'll just check if the service is available
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        "$BACKEND_URL/api/auth/login" 2>/dev/null || echo "000")
    
    if [ "$response" = "400" ] || [ "$response" = "401" ] || [ "$response" = "200" ]; then
        success "CachedAuthService endpoint: Available"
        return 0
    else
        error "CachedAuthService endpoint: Not available (HTTP $response)"
        return 1
    fi
}

# Performance test
test_redis_performance() {
    log "Testing Redis performance..."
    
    local start_time=$(date +%s%N)
    
    # Make multiple cache requests
    for i in {1..10}; do
        curl -s -o /dev/null \
            -X POST \
            -H "Content-Type: application/json" \
            -d "{\"key\":\"perf:test:$i\",\"value\":\"Performance test $i\"}" \
            "$BACKEND_URL/api/redis/test-cache" >/dev/null 2>&1
    done
    
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [ $duration -lt 5000 ]; then
        success "Redis performance: OK (${duration}ms for 10 operations)"
    else
        warning "Redis performance: Slow (${duration}ms for 10 operations)"
    fi
}

# Main test execution
main() {
    log "Starting Redis Testing for NoManWeb Project"
    log "Backend URL: $BACKEND_URL"
    log "Log file: $LOG_FILE"
    echo ""
    
    local tests_passed=0
    local tests_failed=0
    
    # Test backend connectivity first
    if test_backend_connection; then
        ((tests_passed++))
    else
        ((tests_failed++))
        error "Backend is not accessible. Please start the Spring Boot application first."
        exit 1
    fi
    
    # Test Redis CLI
    if test_redis_cli; then
        ((tests_passed++))
    else
        ((tests_failed++))
    fi
    
    # Test Redis health
    if test_redis_health; then
        ((tests_passed++))
    else
        ((tests_failed++))
    fi
    
    # Test Redis cache operations
    if test_redis_cache; then
        ((tests_passed++))
    else
        ((tests_failed++))
    fi
    
    # Test Redis stats
    if test_redis_stats; then
        ((tests_passed++))
    else
        ((tests_failed++))
    fi
    
    # Test CachedAuthService
    if test_cached_auth_service; then
        ((tests_passed++))
    else
        ((tests_failed++))
    fi
    
    # Performance test
    test_redis_performance
    
    echo ""
    log "Test Summary:"
    success "Passed: $tests_passed tests"
    if [ $tests_failed -gt 0 ]; then
        error "Failed: $tests_failed tests"
    fi
    
    echo ""
    if [ $tests_failed -eq 0 ]; then
        success "🎉 All Redis tests passed! Redis is working correctly."
        log "You can now use the frontend Redis testing page at: http://localhost:3000/test-redis"
    else
        error "❌ Some Redis tests failed. Check the log file for details: $LOG_FILE"
    fi
    
    echo ""
    log "Testing completed. Check the log file: $LOG_FILE"
}

# Help function
show_help() {
    echo "Redis Testing Script for NoManWeb Project"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -u, --url      Backend URL (default: http://localhost:8080)"
    echo "  -l, --log      Log file path (default: redis_test_TIMESTAMP.log)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run with default settings"
    echo "  $0 -u http://localhost:9000          # Test different backend URL"
    echo "  $0 -l custom_test.log                # Use custom log file"
    echo ""
    echo "Prerequisites:"
    echo "  1. Redis server running on localhost:6379"
    echo "  2. Spring Boot backend running"
    echo "  3. curl and jq installed (optional)"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -u|--url)
            BACKEND_URL="$2"
            shift 2
            ;;
        -l|--log)
            LOG_FILE="$2"
            shift 2
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if curl is available
    if ! command -v curl >/dev/null 2>&1; then
        error "curl is not installed. Please install curl to run this script."
        exit 1
    fi
    
    # Check if jq is available (optional)
    if ! command -v jq >/dev/null 2>&1; then
        warning "jq is not installed. JSON parsing will be limited."
    fi
    
    # Check if Redis is running
    if command -v redis-cli >/dev/null 2>&1; then
        if ! redis-cli ping >/dev/null 2>&1; then
            warning "Redis server might not be running. Start Redis with: redis-server"
        fi
    else
        warning "Redis CLI not found. Install Redis to run CLI tests."
    fi
    
    success "Prerequisites check completed"
}

# Run the script
check_prerequisites
main 