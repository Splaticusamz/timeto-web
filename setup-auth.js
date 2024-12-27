import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Set emulator hosts before initialization
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Initialize Firebase Admin without credentials for emulator
const app = initializeApp({
  projectId: 'timeto-69867'
});

const auth = getAuth(app);
const db = getFirestore(app);

async function setupTestUsers() {
  try {
    // Part 1: Creates auth user
    const userRecord = await auth.createUser({
      email: 'samz@timeto.gg',
      password: 'test123',
      displayName: 'Sam Admin'
    });

    // Part 2: Creates document in users collection
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email: 'samz@timeto.gg',
      firstName: 'Sam',
      lastName: 'Admin',
      isOnboard: true,
      systemRole: 'system_admin',
      tenantId: 'publicOrgAdmin',
      organizations: {},
      s_meta: {
        admin: true
      }
    });
  } catch (error) {
    console.error('Error setting up admin user:', error);
  }
}

setupTestUsers().catch(console.error);
