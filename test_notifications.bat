@echo off
REM Notification Testing Script for Windows
REM This script helps test Gmail and LINE notifications manually

echo ========================================
echo    Notification Testing Helper Script
echo ========================================
echo.

REM Set your test configuration here
set BASE_URL=http://localhost:8080
set TEST_USER_1=testuser1
set TEST_USER_2=testuser2
set TEST_STORY_ID=your-test-story-id
set JWT_TOKEN=your-jwt-token-here

echo Please update the following variables in this script before running:
echo - JWT_TOKEN: Your authentication token
echo - TEST_STORY_ID: A valid story ID for testing
echo.
echo Current Configuration:
echo - Base URL: %BASE_URL%
echo - Test User 1: %TEST_USER_1%
echo - Test User 2: %TEST_USER_2%
echo.

echo Choose a test to run:
echo 1. Test Follow Notification
echo 2. Test Story Like Notification  
echo 3. Test Comment Notification
echo 4. Test New Chapter Notification
echo 5. Test System Notification (Admin)
echo 6. Check Notification Preferences
echo 7. View Recent Notifications
echo 8. Run All Tests
echo 9. Exit
echo.

set /p choice=Enter your choice (1-9): 

if "%choice%"=="1" goto test_follow
if "%choice%"=="2" goto test_like
if "%choice%"=="3" goto test_comment
if "%choice%"=="4" goto test_chapter
if "%choice%"=="5" goto test_system
if "%choice%"=="6" goto check_preferences
if "%choice%"=="7" goto view_notifications
if "%choice%"=="8" goto run_all
if "%choice%"=="9" goto exit
goto invalid_choice

:test_follow
echo.
echo Testing Follow Notification...
echo User 1 will follow User 2
curl -X POST "%BASE_URL%/api/users/%TEST_USER_2%/follow" ^
  -H "Authorization: Bearer %JWT_TOKEN%" ^
  -H "Content-Type: application/json"
echo.
echo Check %TEST_USER_2%'s email and LINE for follow notification
goto end

:test_like
echo.
echo Testing Story Like Notification...
echo User 1 will like a story
curl -X POST "%BASE_URL%/api/stories/%TEST_STORY_ID%/like" ^
  -H "Authorization: Bearer %JWT_TOKEN%" ^
  -H "Content-Type: application/json"
echo.
echo Check story author's email and LINE for like notification
goto end

:test_comment
echo.
echo Testing Comment Notification...
echo User 1 will comment on a story
curl -X POST "%BASE_URL%/api/stories/%TEST_STORY_ID%/comments" ^
  -H "Authorization: Bearer %JWT_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"content\": \"This is a test comment for notification testing!\"}"
echo.
echo Check story author's email and LINE for comment notification
goto end

:test_chapter
echo.
echo Testing New Chapter Notification...
echo Publishing a new chapter
curl -X POST "%BASE_URL%/api/stories/%TEST_STORY_ID%/chapters" ^
  -H "Authorization: Bearer %JWT_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\": \"Test Chapter for Notifications\", \"content\": \"This is a test chapter to verify notifications work.\", \"isPublished\": true}"
echo.
echo Check followers' email and LINE for new chapter notification
goto end

:test_system
echo.
echo Testing System Notification...
echo Sending system notification (requires admin token)
curl -X POST "%BASE_URL%/api/admin/notifications/system" ^
  -H "Authorization: Bearer %JWT_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\": \"Test System Notification\", \"message\": \"This is a test system notification to verify the notification system.\"}"
echo.
echo Check all users' email and LINE for system notification
goto end

:check_preferences
echo.
echo Checking Notification Preferences...
curl -X GET "%BASE_URL%/api/users/me/notification-preferences" ^
  -H "Authorization: Bearer %JWT_TOKEN%"
echo.
goto end

:view_notifications
echo.
echo Viewing Recent Notifications...
curl -X GET "%BASE_URL%/api/notifications?page=0&size=10" ^
  -H "Authorization: Bearer %JWT_TOKEN%"
echo.
goto end

:run_all
echo.
echo Running All Notification Tests...
echo.
echo 1/5 Testing Follow Notification...
curl -X POST "%BASE_URL%/api/users/%TEST_USER_2%/follow" ^
  -H "Authorization: Bearer %JWT_TOKEN%" ^
  -H "Content-Type: application/json"
echo.
echo.
echo 2/5 Testing Story Like Notification...
curl -X POST "%BASE_URL%/api/stories/%TEST_STORY_ID%/like" ^
  -H "Authorization: Bearer %JWT_TOKEN%" ^
  -H "Content-Type: application/json"
echo.
echo.
echo 3/5 Testing Comment Notification...
curl -X POST "%BASE_URL%/api/stories/%TEST_STORY_ID%/comments" ^
  -H "Authorization: Bearer %JWT_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"content\": \"Automated test comment for notifications\"}"
echo.
echo.
echo 4/5 Testing New Chapter Notification...
curl -X POST "%BASE_URL%/api/stories/%TEST_STORY_ID%/chapters" ^
  -H "Authorization: Bearer %JWT_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\": \"Automated Test Chapter\", \"content\": \"This chapter was created by the automated test script.\", \"isPublished\": true}"
echo.
echo.
echo 5/5 Testing System Notification...
curl -X POST "%BASE_URL%/api/admin/notifications/system" ^
  -H "Authorization: Bearer %JWT_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\": \"Automated Test System Notification\", \"message\": \"All notification tests have been completed.\"}"
echo.
echo.
echo All tests completed! Check email and LINE for notifications.
goto end

:invalid_choice
echo.
echo Invalid choice. Please enter a number between 1-9.
goto end

:end
echo.
echo ========================================
echo.
echo Additional Manual Checks:
echo 1. Check Gmail inbox for notification emails
echo 2. Check LINE app for bot messages
echo 3. Check application logs for any errors
echo 4. Verify notification records in database
echo.
echo Database Query to Check Notifications:
echo SELECT * FROM notifications WHERE created_at ^> NOW() - INTERVAL '1 hour' ORDER BY created_at DESC;
echo.
echo Press any key to exit...
pause >nul

:exit
exit /b 0