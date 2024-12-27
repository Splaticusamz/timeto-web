import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Use completely fake config in development
const firebaseConfig = import.meta.env.VITE_USE_EMULATOR === 'true' ? {
  apiKey: 'demo-key-123',
  authDomain: 'demo-project.firebaseapp.com',
  projectId: 'timeto-69867',
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
const auth = getAuth(app);
const db = getFirestore(app);

if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  // Connect to emulators before any other Firestore operations
  connectFirestoreEmulator(db, 'localhost', 8081);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  
  // Enable persistence after emulator connection
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });
}

export { auth, db };
export default app; 