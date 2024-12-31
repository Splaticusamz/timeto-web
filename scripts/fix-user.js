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

async function fixUser(email) {
  try {
    // Get user from Auth
    const user = await auth.getUserByEmail(email);
    console.log('\n🔍 Found user in Auth:', user.uid);

    // Create Firestore document
    await db.collection('users').doc(user.uid).set({
      id: user.uid,
      firstName: user.displayName?.split(' ')[0] || '',
      lastName: user.displayName?.split(' ')[1] || '',
      auth: {
        email: user.email,
      },
      isOnboard: true,
      systemRole: 'user',
      organizations: {},
      referralOrganizations: [],
      created: new Date(user.metadata.creationTime),
      s_meta: {
        admin: false
      }
    });

    console.log('\n✅ Created Firestore document for user');
    
    // Verify
    const userDoc = await db.collection('users').doc(user.uid).get();
    console.log('\n📄 Verification:', {
      exists: userDoc.exists,
      data: userDoc.data()
    });

  } catch (error) {
    console.error('\n❌ Error fixing user:', error);
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address');
  console.log('Usage: node fix-user.js <email>');
  process.exit(1);
}

console.log(`\n🔧 Fixing user: ${email}...`);
fixUser(email).then(() => process.exit(0)); 