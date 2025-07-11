@echo off
setlocal enabledelayedexpansion

REM IP Tracking and Rate Limiting Test Script for Windows
REM This script helps verify that IP tracking for security is working correctly

REM Configuration
set BACKEND_URL=http://localhost:8080
set API_BASE=%BACKEND_URL%/api/auth
set LOG_FILE=ip_tracking_test.log

REM Colors (Windows doesn't support ANSI colors in batch, but we can use them in PowerShell)
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

REM Logging function
:log
echo [%date% %time%] %~1 | tee -a "%LOG_FILE%"
goto :eof

REM Success function
:success
echo ✅ %~1 | tee -a "%LOG_FILE%"
goto :eof

REM Warning function
:warning
echo ⚠️  %~1 | tee -a "%LOG_FILE%"
goto :eof

REM Error function
:error
echo ❌ %~1 | tee -a "%LOG_FILE%"
goto :eof

REM Test data
set TEST_EMAIL=test@example.com
set TEST_PASSWORD=wrongpassword123
set TEST_USERNAME=testuser

REM Function to make API request and return status code
:make_request
set endpoint=%~1
set data=%~2
set headers=%~3

REM Use PowerShell to make the request
powershell -Command "try { $response = Invoke-WebRequest -Uri '%API_BASE%%endpoint%' -Method POST -Headers @{'Content-Type'='application/json'; %headers%} -Body '%data%' -UseBasicParsing; Write-Output $response.StatusCode } catch { Write-Output '000' }"
goto :eof

REM Function to test rate limiting
:test_rate_limiting
set test_name=%~1
set endpoint=%~2
set data=%~3
set expected_limit=%~4
set time_window=%~5

call :log "Testing %test_name% rate limiting (%expected_limit% attempts per %time_window%)"

set rate_limited=false
set attempts=0

for /l %%i in (1,1,%expected_limit%) do (
    set /a attempts=%%i
    call :make_request "%endpoint%" "%data%" ""
    set status=!errorlevel!
    
    if "!status!"=="429" (
        call :success "Rate limiting triggered after !attempts! attempts (expected around %expected_limit%)"
        set rate_limited=true
        goto :rate_limit_done
    ) else if "!status!"=="000" (
        call :error "Backend server not responding. Make sure it's running on %BACKEND_URL%"
        exit /b 1
    )
    
    call :log "Attempt !attempts!: HTTP !status!"
    timeout /t 1 /nobreak >nul
)

:rate_limit_done
if "%rate_limited%"=="false" (
    call :warning "Rate limiting not triggered after !attempts! attempts (expected around %expected_limit%)"
)

echo.
goto :eof

REM Function to test IP header extraction
:test_ip_headers
call :log "Testing IP header extraction"

REM Test different IPs and headers
for %%i in (203.0.113.1 198.51.100.1 192.168.1.100) do (
    for %%h in (X-Forwarded-For X-Real-IP) do (
        call :log "Testing %%h: %%i"
        call :make_request "/login" "{\"email\":\"%TEST_EMAIL%\",\"password\":\"%TEST_PASSWORD%\"}" "%%h: %%i"
        call :log "Response: HTTP !errorlevel!"
    )
)

echo.
goto :eof

REM Function to check backend logs
:check_backend_logs
call :log "Checking backend logs for IP tracking..."

REM Check for log patterns
for %%p in ("Rate limit exceeded" "getClientIp" "from IP:" "IP address") do (
    findstr /c:"%%~p" nomanweb_backend\logs\nomanweb_backend-logger-*.log >nul 2>&1
    if !errorlevel! equ 0 (
        call :success "Found log entries matching '%%~p'"
    ) else (
        call :warning "No log entries found for '%%~p'"
    )
)

echo.
goto :eof

REM Function to test frontend rate limiting
:test_frontend_rate_limiting
call :log "Testing frontend rate limiting (manual verification required)"
echo Please manually test the following:
echo 1. Go to http://localhost:3000/login
echo 2. Rapidly click the login button with wrong credentials
echo 3. Verify that rate limiting toast messages appear
echo 4. Check browser network tab for 429 responses
echo.
goto :eof

REM Main test execution
:main
call :log "Starting IP Tracking and Rate Limiting Tests"
call :log "Backend URL: %BACKEND_URL%"
call :log "Log file: %LOG_FILE%"
echo.

REM Check if backend is running
call :log "Checking if backend is running..."
powershell -Command "try { $response = Invoke-WebRequest -Uri '%BACKEND_URL%/actuator/health' -UseBasicParsing; Write-Output $response.StatusCode } catch { Write-Output '000' }"
set backend_status=!errorlevel!

if not "!backend_status!"=="200" (
    call :error "Backend server is not running or not accessible at %BACKEND_URL%"
    call :error "Please start the Spring Boot backend server first"
    exit /b 1
)

call :success "Backend server is running"
echo.

REM Run tests
call :test_ip_headers
    call :test_rate_limiting "Login" "/login" "{\"email\":\"%TEST_EMAIL%\",\"password\":\"%TEST_PASSWORD%\"}" 5 "minute"
    call :test_rate_limiting "Registration" "/register" "{\"email\":\"%TEST_EMAIL%\",\"username\":\"%TEST_USERNAME%\",\"password\":\"%TEST_PASSWORD%\"}" 5 "hour"
    call :test_rate_limiting "Password Reset" "/forgot-password" "{\"email\":\"%TEST_EMAIL%\"}" 3 "hour"
    call :test_rate_limiting "Email Change" "/change-email" "{\"currentPassword\":\"%TEST_PASSWORD%\",\"newEmail\":\"newemail@example.com\"}" 3 "hour"
    call :test_rate_limiting "OAuth Email Change" "/change-email-oauth" "{\"newEmail\":\"oauthnewemail@example.com\"}" 3 "hour"
    call :test_rate_limiting "Username Change" "/change-username" "{\"currentPassword\":\"%TEST_PASSWORD%\",\"newUsername\":\"newusername\"}" 3 "hour"
    call :test_rate_limiting "OAuth Username Change" "/change-username-oauth" "{\"newUsername\":\"oauthnewusername\"}" 3 "hour"
    call :test_rate_limiting "Email Verification Resend" "/resend-verification" "{\"email\":\"%TEST_EMAIL%\"}" 3 "hour"
    call :test_rate_limiting "Email Change Verification Resend" "/resend-email-change-verification" "{\"newEmail\":\"newemail@example.com\"}" 3 "hour"

call :check_backend_logs
call :test_frontend_rate_limiting

call :log "IP Tracking Tests Completed"
call :log "Check the log file '%LOG_FILE%' for detailed results"
echo.
call :success "All tests completed. Review the results above."
goto :eof

REM Help function
:show_help
echo IP Tracking and Rate Limiting Test Script
echo.
echo Usage: %~nx0 [OPTIONS]
echo.
echo Options:
echo   -h, --help     Show this help message
echo   -u, --url      Backend URL (default: http://localhost:8080)
echo   -l, --log      Log file path (default: ip_tracking_test.log)
echo.
echo Examples:
echo   %~nx0                                    # Run with default settings
echo   %~nx0 -u http://localhost:9000          # Test different backend URL
echo   %~nx0 -l custom_test.log                # Use custom log file
echo.
goto :eof

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :run_main
if "%~1"=="-h" goto :show_help
if "%~1"=="--help" goto :show_help
if "%~1"=="-u" (
    set BACKEND_URL=%~2
    set API_BASE=%BACKEND_URL%/api/auth
    shift
    shift
    goto :parse_args
)
if "%~1"=="--url" (
    set BACKEND_URL=%~2
    set API_BASE=%BACKEND_URL%/api/auth
    shift
    shift
    goto :parse_args
)
if "%~1"=="-l" (
    set LOG_FILE=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--log" (
    set LOG_FILE=%~2
    shift
    shift
    goto :parse_args
)

call :error "Unknown option: %~1"
call :show_help
exit /b 1

:run_main
call :main
goto :eof

REM Start execution
if "%~1"=="" goto :run_main
call :parse_args 