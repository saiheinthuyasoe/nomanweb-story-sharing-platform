@echo off
setlocal enabledelayedexpansion

REM Real-time IP Tracking Monitor for Windows
REM This script monitors backend logs for IP tracking and rate limiting events

echo ========================================
echo    IP Tracking Real-time Monitor
echo ========================================
echo.
echo Monitoring backend logs for IP tracking events...
echo Press Ctrl+C to stop monitoring
echo.

REM Check if backend logs directory exists
if not exist "nomanweb_backend\logs" (
    echo ❌ Backend logs directory not found: nomanweb_backend\logs
    echo Please make sure the backend server is running and generating logs.
    pause
    exit /b 1
)

REM Find the most recent log file
for /f "delims=" %%i in ('dir /b /od nomanweb_backend\logs\nomanweb_backend-logger-*.log 2^>nul') do set latest_log=nomanweb_backend\logs\%%i

if not defined latest_log (
    echo ❌ No log files found in nomanweb_backend\logs\
    echo Please start the backend server to generate logs.
    pause
    exit /b 1
)

echo 📁 Monitoring log file: %latest_log%
echo.

REM Monitor the log file in real-time
:monitor_loop
cls
echo ========================================
echo    IP Tracking Real-time Monitor
echo ========================================
echo 📁 Log file: %latest_log%
echo ⏰ Last updated: %date% %time%
echo.

REM Show recent IP tracking events
echo 🔍 Recent IP Tracking Events:
echo ----------------------------------------
powershell -Command "Get-Content '%latest_log%' | Select-String -Pattern '(IP|Rate limit|login|register|password)' | Select-Object -Last 10 | ForEach-Object { Write-Host $_.Line }"

echo.
echo 🔍 Recent Rate Limiting Events:
echo ----------------------------------------
powershell -Command "Get-Content '%latest_log%' | Select-String -Pattern 'Rate limit exceeded' | Select-Object -Last 5 | ForEach-Object { Write-Host $_.Line }"

echo.
echo 🔍 Recent Authentication Attempts:
echo ----------------------------------------
powershell -Command "Get-Content '%latest_log%' | Select-String -Pattern '(login|register|password reset)' | Select-Object -Last 5 | ForEach-Object { Write-Host $_.Line }"

echo.
echo ========================================
echo Press Ctrl+C to stop monitoring
echo Refreshing in 5 seconds...
echo ========================================

timeout /t 5 /nobreak >nul
goto :monitor_loop 