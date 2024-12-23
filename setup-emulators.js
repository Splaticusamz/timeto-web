import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

export function connectToEmulators(app) {
  if (window.location.hostname === 'localhost') {
    try {
      const db = getFirestore(app);
      const auth = getAuth(app);
      
      // Connect to emulators with correct ports from emulator output
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      
      console.log('🔥 Using Firebase emulators');
    } catch (error) {
      console.error('Error connecting to emulators:', error);
    }
  }
} 