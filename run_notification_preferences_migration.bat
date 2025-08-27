@echo off
echo Running notification preferences migration...
echo.

cd nomanweb_backend

echo Connecting to PostgreSQL database to run migration...
echo Please ensure your database is running and accessible.
echo.

:: Run the migration SQL file
psql -U postgres -d nomanweb -f src\main\resources\notification_preferences_migration.sql

echo.
echo Migration completed!
echo The users table now has email_notifications_enabled and line_notifications_enabled columns.
echo.

pause