import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize admin with emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081';

admin.initializeApp({
  projectId: 'timeto-69867'  // No credentials needed for emulator
});

const db = admin.firestore();

async function importCollection(data, collectionPath) {
  console.log(`Importing ${collectionPath}`);
  
  for (const [docId, docData] of Object.entries(data)) {
    const { _collections, ...documentData } = docData;
    const docRef = db.doc(`${collectionPath}/${docId}`);
    
    await docRef.set(documentData);
    
    // Import subcollections if they exist
    if (_collections) {
      for (const [subCollectionId, subCollectionData] of Object.entries(_collections)) {
        await importCollection(subCollectionData, `${collectionPath}/${docId}/${subCollectionId}`);
      }
    }
  }
}

async function importFirestore() {
  console.log('Starting import to emulator...');
  const backupData = JSON.parse(
    fs.readFileSync(join(__dirname, 'firestore-backup.json'), 'utf8')
  );

  for (const [collectionId, collectionData] of Object.entries(backupData)) {
    await importCollection(collectionData, collectionId);
  }
  
  console.log('Import completed!');
  admin.app().delete();
}

importFirestore().catch(console.error); 