import admin from 'firebase-admin';

// Set emulator host before initialization
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Initialize without credentials since we're using emulator
const app = admin.initializeApp({
  projectId: 'timeto-69867'
});

const db = admin.firestore();

async function checkImportedData() {
  try {
    // Check what collections exist
    console.log('Checking collections...');
    const collections = ['organizations', 'users', 'events', 'chats', 'contentReports', 'leads', 'publicEvents', 'recurrences', 'scheduledNotifications', 'userSettings'];
    
    for (const collectionName of collections) {
      console.log(`\nChecking ${collectionName} collection:`);
      try {
        const snapshot = await db.collection(collectionName).get();
        console.log(`Found ${snapshot.size} documents`);
        
        if (snapshot.size > 0) {
          // Print first document as sample
          const firstDoc = snapshot.docs[0];
          console.log('Sample document:', {
            id: firstDoc.id,
            data: firstDoc.data()
          });
        }
      } catch (collectionError) {
        console.error(`Error accessing ${collectionName}:`, collectionError.message);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkImportedData().then(() => process.exit(0));
