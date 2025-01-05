import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'test-api-key',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// Add connection status tracking
let emulatorConnected = false;

// Force emulator connection
if (process.env.NODE_ENV === 'development') {
  console.debug('🔥 Connecting to emulators...');
  try {
    if (!emulatorConnected) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFunctionsEmulator(functions, 'localhost', 5001);
      connectStorageEmulator(storage, 'localhost', 9199);
      emulatorConnected = true;
      console.debug('✅ Successfully connected to Firebase emulators');
    }
  } catch (error) {
    console.error('❌ Failed to connect to emulators:', error);
    throw new Error('Failed to connect to Firebase emulators. Please ensure they are running.');
  }
}

export { db, auth, functions, storage }; 