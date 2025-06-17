// Firebase configuration for Google OAuth
// Note: Firebase SDK needs to be installed first: npm install firebase @firebase/auth

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY||"AIzaSyCZmt2rv6mRCa5as6ja39lbN7OR5m5O2E8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN||"nomanweb-ssp.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID||"nomanweb-ssp",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET||"nomanweb-ssp.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID||"178736588876",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID||"1:178736588876:web:7d707f671e61cca5526ce9",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID||"G-GRSV3JGZZP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export default app; 