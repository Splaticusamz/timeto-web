import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Set emulator hosts
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

const app = initializeApp({
  projectId: 'timeto-69867'
});

const auth = getAuth(app);
const db = getFirestore(app);

async function testRegistration() {
  const testEmail = '123@test.com';
  
  try {
    // Delete user if exists
    try {
      const user = await auth.getUserByEmail(testEmail);
      await auth.deleteUser(user.uid);
      await db.collection('users').doc(user.uid).delete();
      console.log('Deleted existing user');
    } catch (e) {
      // User doesn't exist, that's fine
    }

    // Create new user
    const userRecord = await auth.createUser({
      email: testEmail,
      password: 'test123'
    });

    // Create Firestore document
    await db.collection('users').doc(userRecord.uid).set({
      email: testEmail,
      firstName: 'Test',
      lastName: 'User',
      auth: {
        email: testEmail,
      },
      systemRole: 'user',
      organizations: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      isOnboard: true,
      referralOrganizations: []
    });

    console.log('Test completed successfully');
    
    // Verify
    const docCheck = await db.collection('users').doc(userRecord.uid).get();
    console.log('Document check:', {
      exists: docCheck.exists,
      data: docCheck.exists ? docCheck.data() : null
    });

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRegistration(); 