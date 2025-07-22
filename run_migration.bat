@echo off
echo Running database migration for chapters_at_purchase column...
echo.

cd nomanweb_backend

echo Starting Spring Boot application to run migration...
echo The application will automatically run the migration when it starts.
echo Press Ctrl+C to stop after the migration is complete.
echo.

mvn spring-boot:run

pause 