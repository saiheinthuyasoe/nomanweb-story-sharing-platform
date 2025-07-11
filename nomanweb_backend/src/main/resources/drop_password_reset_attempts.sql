-- Migration: Drop password_reset_attempts table
-- Reason: Password reset rate limiting is now handled by Bucket4j in-memory like login/register
-- Date: 2024-01-XX

-- Drop the password_reset_attempts table
DROP TABLE IF EXISTS password_reset_attempts;

-- Note: This migration removes the database tracking for password reset attempts
-- Rate limiting is now handled consistently across login, register, and password reset
-- using Bucket4j in-memory buckets in the RateLimitService 