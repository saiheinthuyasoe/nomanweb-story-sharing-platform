# 🔥 URGENT: Fix Firebase Security Issue

GitHub blocked your push because you're committing Firebase credentials. Here's the fix:

## 🚨 Immediate Fix Steps

### 1. Reset the Dangerous Commit
```bash
git reset HEAD~1
```

### 2. Add Firebase Files to .gitignore
```bash
echo "# Firebase - Never commit credentials!" >> .gitignore
echo "firebase-service-account*.json" >> .gitignore
echo "**/firebase-service-account*.json" >> .gitignore
```

### 3. Remove Firebase File from Git
```bash
git rm --cached nomanweb_backend/src/main/resources/firebase-service-account.json
```

### 4. Commit and Push Safely
```bash
git add .gitignore
git commit -m "Add firebase credentials to gitignore"
git add .
git commit -m "Add environment variable support"
git push origin main
```

## 🔐 Secure Firebase Setup

### For Development:
```bash
# Keep your firebase-service-account.json file locally
# Set the path as environment variable
export FIREBASE_SERVICE_ACCOUNT_PATH="/path/to/your/firebase-service-account.json"
```

### For Production:
```bash
# Use environment variables instead of files
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key\n-----END PRIVATE KEY-----\n"
export FIREBASE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
```

## ✅ Verification

Your updated `FirebaseConfig.java` now supports:
- Environment variables (production)
- File paths (development)
- Default credentials (cloud deployment)

This is much more secure and CI/CD ready! 