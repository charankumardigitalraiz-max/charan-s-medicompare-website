import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyArSKM9NCI-FjL0JL9K1VnIXuo0CL5OoOA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "medicompare-76c17.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "medicompare-76c17",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "medicompare-76c17.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1048864032783",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1048864032783:web:4f807ec85d77ec5bd2fb7a",
  // measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const isMessagingSupported = typeof window !== 'undefined' && 
                             'serviceWorker' in navigator && 
                             'PushManager' in window && 
                             'Notification' in window;

export const messaging = isMessagingSupported ? getMessaging(app) : null;

export default app;
