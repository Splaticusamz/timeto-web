import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Use completely fake config in development to ensure we never touch production
const firebaseConfig = import.meta.env.VITE_USE_EMULATOR === 'true' ? {
  apiKey: 'demo-key-123',
  authDomain: 'demo-project.firebaseapp.com',
  projectId: 'demo-project',
} : {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: "timeto-web.firebasestorage.app",
  messagingSenderId: "741706093241",
  appId: "1:741706093241:web:791a8d9ef0dfcb3c0c4168",
  measurementId: "G-WXL7J4DHH2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Connect to emulators in development
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  console.log('🔧 Development mode detected, connecting to emulators...');
  try {
    connectFirestoreEmulator(db, 'localhost', 8082);
    console.log('✅ Connected to Firestore emulator on port 8082');
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    console.log('✅ Connected to Auth emulator on port 9099');
  } catch (err) {
    console.error('❌ Failed to connect to emulators:', err);
  }
} else {
  console.log('🚀 Production mode detected, using live Firebase services');
}

// Enable offline persistence after emulator connection
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firebase persistence failed to enable (multiple tabs open)');
  } else if (err.code === 'unimplemented') {
    console.warn('Firebase persistence not supported in this browser');
  }
});

export const storage = getStorage(app);

export default app; 