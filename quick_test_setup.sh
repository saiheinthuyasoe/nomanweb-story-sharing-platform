#!/bin/bash

# Quick Admin Testing Setup Script
echo "🚀 Starting NoManWeb Admin Testing Setup..."

# Check if backend is running
echo "📡 Checking backend status..."
if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "✅ Backend is running on port 8080"
else
    echo "❌ Backend is not running. Please start with: cd nomanweb_backend && mvn spring-boot:run"
    exit 1
fi

# Check if frontend is running
echo "🎨 Checking frontend status..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running on port 3000"
else
    echo "❌ Frontend is not running. Please start with: cd nomanweb_frontend && npm run dev"
    exit 1
fi

# Test super admin login
echo "🔐 Testing super admin login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@nomanweb.com",
    "password": "admin123",
    "ipAddress": "127.0.0.1",
    "userAgent": "TestScript/1.0"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Super admin login successful"
    
    # Extract token (basic extraction, might need adjustment based on response format)
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "🎟️  Admin Token: $TOKEN"
    
    # Test creating an invitation
    echo "📧 Testing invitation creation..."
    INVITATION_RESPONSE=$(curl -s -X POST http://localhost:8080/api/admin/auth/invitation/create \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "email": "testadmin@example.com",
        "notes": "Test invitation from script",
        "expirationHours": 24,
        "department": "Testing",
        "role": "Admin"
      }')
    
    if echo "$INVITATION_RESPONSE" | grep -q "invitationToken"; then
        echo "✅ Invitation created successfully"
        echo "📋 Response: $INVITATION_RESPONSE"
    else
        echo "❌ Failed to create invitation"
        echo "📋 Response: $INVITATION_RESPONSE"
    fi
    
else
    echo "❌ Super admin login failed"
    echo "📋 Response: $LOGIN_RESPONSE"
    echo ""
    echo "💡 Make sure to run the database migration first:"
    echo "   psql -d your_database -f nomanweb_backend/src/main/resources/admin_migration.sql"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Open http://localhost:3000/admin/login"
echo "2. Login with: superadmin@nomanweb.com / admin123"
echo "3. Navigate to /admin/invitations to manage invitations"
echo "4. Use the testing guides in admin_api_test.http and FRONTEND_TESTING_GUIDE.md"
echo ""
echo "📚 Testing Files Created:"
echo "   - admin_api_test.http (for API testing)"
echo "   - FRONTEND_TESTING_GUIDE.md (for UI testing)"
echo "   - admin_migration.sql (database setup)"
echo ""
echo "Happy Testing! 🎉" 