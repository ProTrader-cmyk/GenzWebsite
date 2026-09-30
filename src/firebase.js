import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAU6johl9ow1M5MPu-nJzE5yPak9EOwbuc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'genzdatabase-7f05b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'genzdatabase-7f05b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'genzdatabase-7f05b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '905323072379',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:905323072379:web:4ad1ef3306f6508b010bde',
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
