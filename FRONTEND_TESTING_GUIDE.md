# 🎨 **Frontend Admin Testing Guide**

## **Prerequisites**
- Backend running on `http://localhost:8080`
- Frontend running on `http://localhost:3000`
- Database with admin_invitations table created
- Super admin user created (see admin_migration.sql)

## **🔑 Test Admin Login Flow**

### **Step 1: Access Admin Login**
1. Navigate to: `http://localhost:3000/admin/login`
2. **Expected**: Red-themed admin login page with security warnings

### **Step 2: Test Admin Authentication**
1. **Email**: `superadmin@nomanweb.com`
2. **Password**: `admin123`
3. **Admin Code**: (leave empty)
4. Click "Admin Login"
5. **Expected**: Redirect to `/admin/dashboard`

### **Step 3: Verify Admin Dashboard Access**
1. **Expected**: Admin layout with red theme
2. **Expected**: "Secure Admin Access" indicator in top bar
3. **Expected**: Admin sidebar with navigation items
4. **Expected**: User info shows "Administrator" role

## **📧 Test Admin Invitation System**

### **Step 4: Access Invitations Page**
1. Navigate to: `http://localhost:3000/admin/invitations`
2. **Expected**: Admin invitations management page
3. **Expected**: Statistics cards showing invitation counts
4. **Expected**: "Create Invitation" button

### **Step 5: Create New Invitation**
1. Click "Create Invitation" button
2. Fill out the form:
   - **Email**: `testadmin@example.com`
   - **Expiration Hours**: `24`
   - **Department**: `Content Management`
   - **Notes**: `Test invitation`
3. Click "Create Invitation"
4. **Expected**: Success message and invitation appears in table
5. **Expected**: Invitation status shows "PENDING"

### **Step 6: Copy Invitation Token**
1. From the invitations table, note the invitation ID
2. From backend logs or database, get the invitation token
3. **Alternative**: Use the API test to get the token

## **👤 Test Admin Registration Flow**

### **Step 7: Test Invitation Validation**
1. Navigate to: `http://localhost:3000/admin/register?token={INVITATION_TOKEN}`
2. **Expected**: Registration page with invitation details
3. **Expected**: Green "Invitation Valid" banner
4. **Expected**: Pre-filled email field (disabled)

### **Step 8: Complete Admin Registration**
1. Fill out the registration form:
   - **First Name**: `Test`
   - **Last Name**: `Admin`
   - **Password**: `testadmin123`
   - **Confirm Password**: `testadmin123`
   - **Phone**: `+1234567890`
   - **Department**: `Content Management`
2. Click "Complete Registration"
3. **Expected**: Success message and redirect to admin dashboard
4. **Expected**: New admin logged in automatically

### **Step 9: Verify New Admin Access**
1. **Expected**: New admin user in dashboard
2. **Expected**: Can access all admin pages
3. **Expected**: Can create more invitations

## **🔐 Test Security Features**

### **Step 10: Test Access Protection**
1. **Logout** from admin panel
2. Try to access: `http://localhost:3000/admin/dashboard`
3. **Expected**: Redirect to `/admin/login`

### **Step 11: Test Invalid Invitation**
1. Navigate to: `http://localhost:3000/admin/register?token=invalid-token`
2. **Expected**: "Invalid Invitation" error page

### **Step 12: Test Expired Invitation**
1. Create invitation with 1 hour expiration
2. Wait or manually expire in database
3. Try to use the invitation
4. **Expected**: "Invitation has expired" error

### **Step 13: Test Used Invitation**
1. Use an invitation to register
2. Try to use the same invitation token again
3. **Expected**: "Invitation already used" error

## **⚡ Test Admin Management Features**

### **Step 14: Test Invitation Management**
1. Go to `/admin/invitations`
2. Test filtering by status
3. Test revoking pending invitations
4. **Expected**: Revoked invitations show "REVOKED" status

### **Step 15: Test User Management**
1. Create a regular user account first
2. Go to `/admin/users` (if implemented)
3. Test promoting user to admin
4. Test demoting admin to user
5. **Expected**: Role changes reflected immediately

## **🧪 Error Testing**

### **Step 16: Test Invalid Admin Login**
1. Try login with wrong credentials
2. **Expected**: Clear error message
3. **Expected**: Login attempts logged in backend

### **Step 17: Test Network Errors**
1. Stop backend server
2. Try admin actions
3. **Expected**: Graceful error handling
4. **Expected**: Appropriate error messages

### **Step 18: Test Token Expiration**
1. Manually expire admin token in localStorage
2. Try to access admin pages
3. **Expected**: Redirect to admin login

## **📱 Visual Testing Checklist**

### **UI/UX Verification**
- [ ] Admin login page has security warnings
- [ ] Red theme distinguishes admin from user interface  
- [ ] Loading states work properly
- [ ] Error messages are clear and helpful
- [ ] Success notifications appear
- [ ] Form validation works correctly
- [ ] Responsive design on mobile/tablet
- [ ] Admin badge/indicator always visible
- [ ] Logout redirects to admin login (not user login)

### **Security Indicators**
- [ ] "Secure Admin Access" badge in top bar
- [ ] "Administrator" role displayed in sidebar
- [ ] Admin-specific navigation items
- [ ] Clear separation from regular user interface

## **🔍 Browser Console Testing**

### **Check for Errors**
1. Open browser Developer Tools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. **Expected**: No critical errors
5. **Expected**: API calls return appropriate status codes

### **Token Storage Verification**
1. Check Application/Local Storage tab
2. **Expected**: `adminToken` and `adminUser` stored separately
3. **Expected**: Tokens are valid JWT format

## **📊 Backend Log Verification**

### **Check Admin Activity Logging**
1. Monitor backend logs during testing
2. **Expected**: Admin login attempts logged with IP
3. **Expected**: Invitation creation/usage logged
4. **Expected**: Security violations logged

### **Database Verification**
1. Check `admin_invitations` table
2. **Expected**: Invitations properly created/updated
3. **Expected**: Status changes tracked correctly
4. **Expected**: Foreign key relationships intact

## **✅ Success Criteria**

**All tests pass if:**
- ✅ Admin login works with separate authentication
- ✅ Invitation system creates and validates tokens
- ✅ Registration only works with valid invitations
- ✅ Admin interface is visually distinct and secure
- ✅ Access control prevents unauthorized access
- ✅ Error handling is graceful and informative
- ✅ All CRUD operations work for invitations
- ✅ Audit trail is maintained in database
- ✅ No security vulnerabilities detected

## **🚨 Common Issues & Solutions**

### **Issue**: Admin login fails
**Solution**: Check if super admin user exists in database

### **Issue**: Invitation creation fails  
**Solution**: Verify admin token is valid and user has ADMIN role

### **Issue**: Registration page shows "Invalid Invitation"
**Solution**: Check invitation token format and expiration

### **Issue**: Admin dashboard redirects to login
**Solution**: Verify `adminToken` exists in localStorage and is valid

### **Issue**: 403 Forbidden errors
**Solution**: Check Spring Security configuration and role assignments

---

**Happy Testing! 🎉**

This comprehensive testing ensures your admin security system is production-ready! 