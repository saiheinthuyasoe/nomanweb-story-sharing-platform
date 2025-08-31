# Email Delivery Troubleshooting Guide

## Issue Summary
Emails are being sent successfully from the backend to `saiheinthuyasoe@gmail.com` but may not be reaching other email addresses.

## Backend Status
✅ **Email Service Working**: Backend logs show successful email sending to all tested addresses
✅ **SMTP Configuration**: Gmail SMTP settings are correctly configured
✅ **No Backend Errors**: No SMTP authentication or sending errors in logs

## Possible Causes

### 1. Gmail Spam Filtering
- Gmail may be filtering emails from your SMTP account
- Emails might be going to spam/junk folders
- **Solution**: Check spam folders on recipient emails

### 2. Email Provider Restrictions
- Some email providers block emails from certain SMTP servers
- Corporate email servers may have stricter filtering
- **Solution**: Test with different email providers (Gmail, Yahoo, Outlook, etc.)

### 3. SMTP Rate Limiting
- Gmail SMTP has daily sending limits
- Too many emails in short time may trigger rate limiting
- **Solution**: Space out email sending or check Gmail account limits

### 4. SPF/DKIM/DMARC Issues
- Email authentication records may not be properly configured
- This can cause emails to be marked as spam or rejected
- **Solution**: Configure proper email authentication for your domain

### 5. Sender Reputation
- New Gmail accounts may have lower sender reputation
- This can affect email deliverability
- **Solution**: Gradually increase sending volume and maintain good practices

## Testing Steps

### Step 1: Check Spam Folders
1. Ask recipients to check their spam/junk folders
2. If emails are there, mark them as "Not Spam"
3. This helps improve sender reputation

### Step 2: Test Different Email Providers
```bash
# Test Gmail
curl -X POST http://localhost:8080/api/test/email -H "Content-Type: application/json" -d '{"email": "test@gmail.com"}'

# Test Yahoo
curl -X POST http://localhost:8080/api/test/email -H "Content-Type: application/json" -d '{"email": "test@yahoo.com"}'

# Test Outlook
curl -X POST http://localhost:8080/api/test/email -H "Content-Type: application/json" -d '{"email": "test@outlook.com"}'
```

### Step 3: Monitor Gmail Account
1. Check your Gmail account (saiheinthuyasoe@gmail.com) for:
   - Bounce-back messages
   - Delivery failure notifications
   - Account suspension warnings

### Step 4: Check Gmail SMTP Limits
- Gmail free accounts: 500 emails/day
- Gmail Workspace: 2000 emails/day
- Check if you've hit these limits

## Current Configuration
```properties
# From application.properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=saiheinthuyasoe@gmail.com
spring.mail.password=[APP_PASSWORD]
app.email.from=saiheinthuyasoe@gmail.com
```

## Recommendations

### Immediate Actions
1. **Check Spam Folders**: Ask recipients to check spam/junk folders
2. **Test Multiple Providers**: Send test emails to different email providers
3. **Monitor Sending Account**: Check for bounce-backs or warnings

### Long-term Solutions
1. **Configure Email Authentication**: Set up SPF, DKIM, and DMARC records
2. **Use Professional Email Service**: Consider using SendGrid, Mailgun, or AWS SES
3. **Implement Email Queuing**: Add retry logic and better error handling
4. **Monitor Delivery Rates**: Track email delivery success rates

## Verification Commands
```bash
# Check if backend is running
curl http://localhost:8080/actuator/health

# Test email to your own address
curl -X POST http://localhost:8080/api/test/email -H "Content-Type: application/json" -d '{"email": "saiheinthuyasoe@gmail.com"}'

# Test email to different provider
curl -X POST http://localhost:8080/api/test/email -H "Content-Type: application/json" -d '{"email": "recipient@example.com"}'
```

## Next Steps
1. Confirm with recipients that they've checked spam folders
2. Test with multiple email providers to identify patterns
3. Consider implementing a more robust email delivery service
4. Monitor Gmail account for any delivery issues or warnings