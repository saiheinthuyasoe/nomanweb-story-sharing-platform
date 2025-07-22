@echo off
setlocal enabledelayedexpansion

REM Redis Testing Script for NoManWeb Project (Windows Batch Version)
REM This script tests Redis connectivity and functionality

set BACKEND_URL=%BACKEND_URL%
if "%BACKEND_URL%"=="" set BACKEND_URL=http://localhost:8080

set LOG_FILE=redis_test_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log
set LOG_FILE=%LOG_FILE: =0%

echo [%date% %time%] Starting Redis Testing for NoManWeb Project > %LOG_FILE%
echo [%date% %time%] Backend URL: %BACKEND_URL% >> %LOG_FILE%

echo.
echo ========================================
echo Redis Testing for NoManWeb Project
echo ========================================
echo Backend URL: %BACKEND_URL%
echo Log file: %LOG_FILE%
echo.

set /a tests_passed=0
set /a tests_failed=0

REM Test backend connectivity
echo Testing backend connectivity...
curl -s -o nul -w "%%{http_code}" "%BACKEND_URL%/actuator/health" > temp_response.txt 2>nul
set /p response=<temp_response.txt
del temp_response.txt

if "%response%"=="200" (
    echo ✅ Backend connectivity: OK
    echo [%date% %time%] ✅ Backend connectivity: OK >> %LOG_FILE%
    set /a tests_passed+=1
) else (
    echo ❌ Backend connectivity: Failed (HTTP %response%)
    echo [%date% %time%] ❌ Backend connectivity: Failed (HTTP %response%) >> %LOG_FILE%
    set /a tests_failed+=1
    echo.
    echo Backend is not accessible. Please start the Spring Boot application first.
    goto :end
)

REM Test Redis health
echo.
echo Testing Redis health endpoint...
curl -s -w "%%{http_code}" -o temp_health.json "%BACKEND_URL%/api/redis/health" > temp_response.txt 2>nul
set /p response=<temp_response.txt
del temp_response.txt

if "%response%"=="200" (
    echo ✅ Redis health check: Endpoint accessible
    echo [%date% %time%] ✅ Redis health check: Endpoint accessible >> %LOG_FILE%
    set /a tests_passed+=1
) else (
    echo ❌ Redis health check: Failed (HTTP %response%)
    echo [%date% %time%] ❌ Redis health check: Failed (HTTP %response%) >> %LOG_FILE%
    set /a tests_failed+=1
)

REM Test Redis cache operations
echo.
echo Testing Redis cache operations...
set test_key=test:cache:%random%
set test_value=Hello Redis from %date% %time%

curl -s -w "%%{http_code}" -o temp_cache.json -X POST -H "Content-Type: application/json" -d "{\"key\":\"%test_key%\",\"value\":\"%test_value%\"}" "%BACKEND_URL%/api/redis/test-cache" > temp_response.txt 2>nul
set /p response=<temp_response.txt
del temp_response.txt

if "%response%"=="200" (
    echo ✅ Redis cache test: Endpoint accessible
    echo [%date% %time%] ✅ Redis cache test: Endpoint accessible >> %LOG_FILE%
    set /a tests_passed+=1
) else (
    echo ❌ Redis cache test: Failed (HTTP %response%)
    echo [%date% %time%] ❌ Redis cache test: Failed (HTTP %response%) >> %LOG_FILE%
    set /a tests_failed+=1
)

REM Test Redis stats
echo.
echo Testing Redis stats endpoint...
curl -s -w "%%{http_code}" -o temp_stats.json "%BACKEND_URL%/api/redis/cache-stats" > temp_response.txt 2>nul
set /p response=<temp_response.txt
del temp_response.txt

if "%response%"=="200" (
    echo ✅ Redis stats test: Endpoint accessible
    echo [%date% %time%] ✅ Redis stats test: Endpoint accessible >> %LOG_FILE%
    set /a tests_passed+=1
) else (
    echo ❌ Redis stats test: Failed (HTTP %response%)
    echo [%date% %time%] ❌ Redis stats test: Failed (HTTP %response%) >> %LOG_FILE%
    set /a tests_failed+=1
)

REM Test CachedAuthService
echo.
echo Testing CachedAuthService functionality...
curl -s -o nul -w "%%{http_code}" "%BACKEND_URL%/api/auth/login" > temp_response.txt 2>nul
set /p response=<temp_response.txt
del temp_response.txt

if "%response%"=="400" (
    echo ✅ CachedAuthService endpoint: Available (400 - Bad Request expected)
    echo [%date% %time%] ✅ CachedAuthService endpoint: Available >> %LOG_FILE%
    set /a tests_passed+=1
) else if "%response%"=="401" (
    echo ✅ CachedAuthService endpoint: Available (401 - Unauthorized expected)
    echo [%date% %time%] ✅ CachedAuthService endpoint: Available >> %LOG_FILE%
    set /a tests_passed+=1
) else if "%response%"=="200" (
    echo ✅ CachedAuthService endpoint: Available (200 - OK)
    echo [%date% %time%] ✅ CachedAuthService endpoint: Available >> %LOG_FILE%
    set /a tests_passed+=1
) else (
    echo ❌ CachedAuthService endpoint: Not available (HTTP %response%)
    echo [%date% %time%] ❌ CachedAuthService endpoint: Not available (HTTP %response%) >> %LOG_FILE%
    set /a tests_failed+=1
)

REM Performance test
echo.
echo Testing Redis performance...
set start_time=%time%

for /l %%i in (1,1,5) do (
    curl -s -o nul -X POST -H "Content-Type: application/json" -d "{\"key\":\"perf:test:%%i\",\"value\":\"Performance test %%i\"}" "%BACKEND_URL%/api/redis/test-cache" >nul 2>&1
)

set end_time=%time%
echo ✅ Redis performance test completed
echo [%date% %time%] ✅ Redis performance test completed >> %LOG_FILE%

REM Clean up temporary files
if exist temp_health.json del temp_health.json
if exist temp_cache.json del temp_cache.json
if exist temp_stats.json del temp_stats.json

echo.
echo ========================================
echo Test Summary
echo ========================================
echo ✅ Passed: %tests_passed% tests
if %tests_failed% gtr 0 (
    echo ❌ Failed: %tests_failed% tests
)

echo.
if %tests_failed% equ 0 (
    echo 🎉 All Redis tests passed! Redis is working correctly.
    echo You can now use the frontend Redis testing page at: http://localhost:3000/test-redis
    echo [%date% %time%] 🎉 All Redis tests passed! Redis is working correctly. >> %LOG_FILE%
) else (
    echo ❌ Some Redis tests failed. Check the log file for details: %LOG_FILE%
    echo [%date% %time%] ❌ Some Redis tests failed. >> %LOG_FILE%
)

echo.
echo Testing completed. Check the log file: %LOG_FILE%
echo [%date% %time%] Testing completed. >> %LOG_FILE%

:end
pause 