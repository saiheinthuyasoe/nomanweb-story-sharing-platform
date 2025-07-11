#!/bin/bash

# IP Tracking and Rate Limiting Test Script
# This script helps verify that IP tracking for security is working correctly

set -e

# Configuration
BACKEND_URL="http://localhost:8080"
API_BASE="$BACKEND_URL/api/auth"
LOG_FILE="ip_tracking_test.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Test data
TEST_EMAIL="test@example.com"
TEST_PASSWORD="wrongpassword123"
TEST_USERNAME="testuser"

# Function to make API request and return status code
make_request() {
    local endpoint=$1
    local data=$2
    local headers=$3
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$API_BASE$endpoint" \
        -H "Content-Type: application/json" \
        -H "$headers" \
        -d "$data" 2>/dev/null || echo "000")
    
    echo "$response"
}

# Function to test rate limiting
test_rate_limiting() {
    local test_name=$1
    local endpoint=$2
    local data=$3
    local expected_limit=$4
    local time_window=$5
    
    log "Testing $test_name rate limiting ($expected_limit attempts per $time_window)"
    
    local rate_limited=false
    local attempts=0
    
    for i in $(seq 1 $((expected_limit + 2))); do
        attempts=$i
        local status=$(make_request "$endpoint" "$data" "")
        
        if [ "$status" = "429" ]; then
            success "Rate limiting triggered after $i attempts (expected around $expected_limit)"
            rate_limited=true
            break
        elif [ "$status" = "000" ]; then
            error "Backend server not responding. Make sure it's running on $BACKEND_URL"
            return 1
        fi
        
        log "Attempt $i: HTTP $status"
        sleep 1
    done
    
    if [ "$rate_limited" = false ]; then
        warning "Rate limiting not triggered after $attempts attempts (expected around $expected_limit)"
    fi
    
    echo ""
}

# Function to test IP header extraction
test_ip_headers() {
    log "Testing IP header extraction"
    
    local test_ips=(
        "203.0.113.1"
        "198.51.100.1" 
        "192.168.1.100"
        "2001:db8::1"
    )
    
    local headers=(
        "X-Forwarded-For"
        "X-Real-IP"
    )
    
    for ip in "${test_ips[@]}"; do
        for header in "${headers[@]}"; do
            log "Testing $header: $ip"
            local status=$(make_request "/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" "$header: $ip")
            log "Response: HTTP $status"
        done
    done
    
    echo ""
}

# Function to test different IPs for rate limiting
test_multiple_ips() {
    log "Testing rate limiting with different IP addresses"
    
    local ips=("192.168.1.100" "192.168.1.101" "192.168.1.102")
    
    for ip in "${ips[@]}"; do
        log "Testing with IP: $ip"
        
        # Make 3 attempts with this IP
        for i in {1..3}; do
            local status=$(make_request "/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" "X-Forwarded-For: $ip")
            log "  Attempt $i: HTTP $status"
        done
        
        # Should not be rate limited yet (limit is 5 per minute)
        if [ "$status" = "429" ]; then
            warning "Unexpected rate limiting for IP $ip after 3 attempts"
        else
            success "IP $ip not rate limited after 3 attempts (as expected)"
        fi
        
        echo ""
    done
}

# Function to check backend logs
check_backend_logs() {
    log "Checking backend logs for IP tracking..."
    
    local log_patterns=(
        "Rate limit exceeded"
        "getClientIp"
        "from IP:"
        "IP address"
    )
    
    for pattern in "${log_patterns[@]}"; do
        local count=$(grep -c "$pattern" nomanweb_backend/logs/nomanweb_backend-logger-*.log 2>/dev/null || echo "0")
        if [ "$count" -gt 0 ]; then
            success "Found $count log entries matching '$pattern'"
        else
            warning "No log entries found for '$pattern'"
        fi
    done
    
    echo ""
}

# Function to test frontend rate limiting
test_frontend_rate_limiting() {
    log "Testing frontend rate limiting (manual verification required)"
    echo "Please manually test the following:"
    echo "1. Go to http://localhost:3000/login"
    echo "2. Rapidly click the login button with wrong credentials"
    echo "3. Verify that rate limiting toast messages appear"
    echo "4. Check browser network tab for 429 responses"
    echo ""
}

# Main test execution
main() {
    log "Starting IP Tracking and Rate Limiting Tests"
    log "Backend URL: $BACKEND_URL"
    log "Log file: $LOG_FILE"
    echo ""
    
    # Check if backend is running
    log "Checking if backend is running..."
    local backend_status=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/actuator/health" 2>/dev/null || echo "000")
    
    if [ "$backend_status" != "200" ]; then
        error "Backend server is not running or not accessible at $BACKEND_URL"
        error "Please start the Spring Boot backend server first"
        exit 1
    fi
    
    success "Backend server is running"
    echo ""
    
    # Run tests
    test_ip_headers
    test_multiple_ips
    test_rate_limiting "Login" "/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" 5 "minute"
    test_rate_limiting "Registration" "/register" "{\"email\":\"$TEST_EMAIL\",\"username\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\"}" 5 "hour"
    test_rate_limiting "Password Reset" "/forgot-password" "{\"email\":\"$TEST_EMAIL\"}" 3 "hour"
    
    check_backend_logs
    test_frontend_rate_limiting
    
    log "IP Tracking Tests Completed"
    log "Check the log file '$LOG_FILE' for detailed results"
    echo ""
    success "All tests completed. Review the results above."
}

# Help function
show_help() {
    echo "IP Tracking and Rate Limiting Test Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -u, --url      Backend URL (default: http://localhost:8080)"
    echo "  -l, --log      Log file path (default: ip_tracking_test.log)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run with default settings"
    echo "  $0 -u http://localhost:9000          # Test different backend URL"
    echo "  $0 -l custom_test.log                # Use custom log file"
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

# Run main function
main "$@" 