# 🔥 Firebase Setup Guide for Google OAuth

## 🚨 **Current Status**
Google OAuth is **temporarily disabled** until Firebase is properly configured. Users can still use email/password authentication.

---

## 📋 **Prerequisites**
- Google account
- Access to Firebase Console
- Admin access to the project

---

## 🔧 **Step-by-Step Firebase Setup**

### **1. Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"**
3. Enter project name: `nomanweb` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click **"Create project"**

### **2. Enable Authentication**

1. In Firebase Console, go to **Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click on **"Google"**
5. Toggle **"Enable"**
6. Set support email: `saiheinthuyasoe@gmail.com`
7. Click **"Save"**

### **3. Add Web App**

1. In Project Overview, click **"Add app"** → **Web**
2. App nickname: `NoManWeb Frontend`
3. Check **"Also set up Firebase Hosting"** (optional)
4. Click **"Register app"**
5. **Copy the Firebase config** (you'll need this)

### **4. Generate Service Account Key**

1. Go to **Project Settings** (gear icon)
2. Click **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Download the JSON file
5. Rename it to `firebase-service-account.json`
6. Place it in `nomanweb_backend/src/main/resources/`

### **5. Configure Authorized Domains**

1. In Authentication → Settings → Authorized domains
2. Add: `localhost` (for development)
3. Add your production domain when ready

---

## ⚙️ **Configuration Steps**

### **Frontend Configuration**

1. **Install Firebase SDK**:
```bash
cd nomanweb_frontend
npm install firebase @firebase/auth
```

2. **Create environment file** `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

3. **Update Firebase config** in `src/lib/firebase.ts`:
```typescript
// Remove the comment about needing to install Firebase
// The config should work once environment variables are set
```

### **Backend Configuration**

1. **Place service account key**:
   - Put `firebase-service-account.json` in `nomanweb_backend/src/main/resources/`

2. **Verify application.properties**:
```properties
# Firebase Configuration
firebase.service-account-key=firebase-service-account.json
```

### **Enable Google OAuth in Frontend**

1. **Update GoogleSignIn component**:
```typescript
// In src/components/auth/GoogleSignIn.tsx
// Uncomment the Firebase code and remove the temporary disabled message
```

---

## 🧪 **Testing Firebase Setup**

### **1. Test Firebase Initialization**

Start the backend and check logs:
```bash
cd nomanweb_backend
mvn spring-boot:run
```

Look for: `Firebase Admin SDK initialized successfully`

### **2. Test Frontend Firebase**

Start the frontend:
```bash
cd nomanweb_frontend
npm run dev
```

Check browser console for Firebase initialization errors.

### **3. Test Google OAuth Flow**

1. Click "Continue with Google" button
2. Should open Google sign-in popup
3. After successful sign-in, should redirect to dashboard

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **"Firebase Admin SDK initialization failed"**
- Check if `firebase-service-account.json` exists in `src/main/resources/`
- Verify the JSON file is valid
- Check file permissions

#### **"Firebase app not initialized"**
- Verify environment variables in `.env.local`
- Check Firebase config object
- Ensure Firebase SDK is installed

#### **"Auth domain not authorized"**
- Add `localhost` to authorized domains in Firebase Console
- Check the auth domain in environment variables

#### **"Invalid ID token"**
- Verify service account key is correct
- Check if Google sign-in is enabled in Firebase Console
- Ensure the project ID matches

### **Debug Commands**

```bash
# Check if Firebase SDK is installed
npm list firebase

# Check environment variables
echo $NEXT_PUBLIC_FIREBASE_API_KEY

# Check service account file
ls -la nomanweb_backend/src/main/resources/firebase-service-account.json
```

---

## 📝 **Sample Configuration Files**

### **Frontend .env.local Example**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=nomanweb-12345.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=nomanweb-12345
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=nomanweb-12345.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### **Service Account JSON Structure**
```json
{
  "type": "service_account",
  "project_id": "nomanweb-12345",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@nomanweb-12345.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

---

## ✅ **Verification Checklist**

- [ ] Firebase project created
- [ ] Google authentication enabled
- [ ] Web app registered
- [ ] Service account key downloaded and placed
- [ ] Frontend environment variables set
- [ ] Firebase SDK installed
- [ ] Backend starts without Firebase errors
- [ ] Frontend loads without Firebase errors
- [ ] Google OAuth button works
- [ ] Can sign in with Google account
- [ ] User is created in database
- [ ] JWT token is generated

---

## 🚀 **Next Steps After Setup**

1. **Test the complete OAuth flow**
2. **Enable Google OAuth in the frontend**
3. **Test user creation and login**
4. **Verify database integration**
5. **Test account linking functionality**

---

## 📞 **Need Help?**

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all configuration files
3. Check browser and server console logs
4. Ensure all dependencies are installed

**Once Firebase is set up, Google OAuth will be fully functional!** 🎉 