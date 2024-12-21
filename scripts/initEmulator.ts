import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'demo-key-123',
  authDomain: 'demo-project.firebaseapp.com',
  projectId: 'demo-project'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators
connectFirestoreEmulator(db, 'localhost', 8082);
connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

const TEST_EMAIL = 'test@timeto.gg';
const TEST_PASSWORD = 'password123';

async function initializeEmulator() {
  try {
    console.log('🔧 Initializing emulator with test data...');

    // Create or get test user
    console.log(`Creating/getting test user: ${TEST_EMAIL}`);
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      } else {
        throw error;
      }
    }
    const userId = userCredential.user.uid;

    // Create user document in Firestore if it doesn't exist
    console.log('Creating/updating user document in Firestore...');
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', userId), {
        email: TEST_EMAIL,
        systemRole: 'system_admin',
        organizations: []
      });
    }

    // Create a demo organization
    console.log('Creating demo organization...');
    const orgId = 'demo-org-1';
    const now = Timestamp.now();
    
    await setDoc(doc(db, 'organizations', orgId), {
      id: orgId,
      name: 'Demo Organization',
      type: 'company',
      description: 'A demo organization for testing',
      location: 'San Francisco, CA',
      contactInfo: {
        email: TEST_EMAIL,
        phone: '+1 (555) 123-4567'
      },
      createdAt: now,
      updatedAt: now,
      ownerId: userId,
      members: {
        [userId]: {
          role: 'owner',
          email: TEST_EMAIL,
          joinedAt: now
        }
      },
      settings: {
        timezone: 'America/Los_Angeles',
        language: 'en'
      }
    });

    // Update user's organizations array
    await setDoc(doc(db, 'users', userId), {
      email: TEST_EMAIL,
      systemRole: 'system_admin',
      organizations: {
        [orgId]: 'owner'
      }
    });

    console.log('✅ Emulator initialized successfully');
    console.log('Test user credentials:');
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Password: ${TEST_PASSWORD}`);
  } catch (error) {
    console.error('❌ Failed to initialize emulator:', error);
  } finally {
    process.exit(0);
  }
}

initializeEmulator(); 