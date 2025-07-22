-- Migration: Remove platform fee from gifts (100% to recipients)
-- Date: 2024-12-19
-- Description: Update gift recipient percentage to 100% to remove platform fee

-- Update the gift recipient percentage to 100% (no platform fee)
UPDATE system_settings 
SET setting_value = '100.00', 
    description = 'Percentage of gift value that recipients receive (no platform fee)'
WHERE setting_key = 'gift_recipient_percentage';

-- Insert if not exists
INSERT INTO system_settings (setting_key, setting_value, description) 
VALUES ('gift_recipient_percentage', '100.00', 'Percentage of gift value that recipients receive (no platform fee)')
ON CONFLICT (setting_key) DO NOTHING;

-- Display completion message
SELECT 'Gift fee removal migration completed successfully!' as status; 