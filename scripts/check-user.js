import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Set emulator hosts
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Initialize Firebase Admin
const app = initializeApp({
  projectId: 'timeto-69867'
});

const auth = getAuth(app);
const db = getFirestore(app);

async function checkUser(email) {
  try {
    // Check Auth
    const user = await auth.getUserByEmail(email);
    console.log('\n🔍 Auth User Found:', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      createdAt: user.metadata.creationTime,
    });

    // Check Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    console.log('\n📄 Firestore Document:', {
      exists: userDoc.exists,
      data: userDoc.exists ? userDoc.data() : null
    });

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('\n❌ User not found in Auth');
    } else {
      console.error('\n❌ Error checking user:', error);
    }
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address');
  console.log('Usage: node check-user.js <email>');
  process.exit(1);
}

console.log(`\n🔎 Checking user: ${email}...`);
checkUser(email).then(() => process.exit(0)); 