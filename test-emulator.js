import admin from 'firebase-admin';

// Set emulator host
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const app = admin.initializeApp({
  projectId: 'test-project-id'
});

const db = admin.firestore();

function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  return new Date(timestamp._seconds * 1000).toLocaleString();
}

async function testDatabaseOperations() {
  try {
    console.log('[DEBUG] Testing database operations...');
    const YOUR_USER_ID = 'K8fRXxDdVp1vQpuxWPXeuDdulv0e';

    // Find organizations you own
    console.log('\n[DEBUG] Looking for organizations you own...');
    const ownedOrgsSnapshot = await db.collection('organizations')
      .where('ownerId', '==', YOUR_USER_ID)
      .orderBy('createdAt', 'desc')
      .get();
    
    console.log(`[DEBUG] Found ${ownedOrgsSnapshot.size} organizations owned by you:`);
    ownedOrgsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('\nOrganization:', {
        id: doc.id,
        name: data.name,
        description: data.description,
        createdAt: formatTimestamp(data.createdAt),
        type: data.type
      });
    });

  } catch (error) {
    console.error('[DEBUG] Error during test:', error);
  }
}

testDatabaseOperations().then(() => {
  console.log('\n[DEBUG] Test completed');
  process.exit(0);
});
