import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read service account file
const serviceAccount = JSON.parse(
  fs.readFileSync(join(__dirname, 'service-account.json'), 'utf8')
);

// Initialize with service account
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backupCollection(collectionRef, path = '') {
  console.log(`Backing up ${path}${collectionRef.id}`);
  const snapshot = await collectionRef.get();
  const data = {};

  for (const doc of snapshot.docs) {
    // Get document data
    data[doc.id] = doc.data();
    
    // Get all subcollections for this document
    const subcollections = await doc.ref.listCollections();
    for (const subcollection of subcollections) {
      const subcollectionPath = `${path}${collectionRef.id}/${doc.id}/`;
      data[doc.id]._collections = data[doc.id]._collections || {};
      data[doc.id]._collections[subcollection.id] = await backupCollection(subcollection, subcollectionPath);
    }
  }

  return data;
}

async function backupFirestore() {
  console.log('Starting Firestore backup...');
  const collections = await db.listCollections();
  const backupData = {};

  for (const collection of collections) {
    backupData[collection.id] = await backupCollection(collection);
  }

  // Save to backup file
  const backupPath = join(__dirname, 'firestore-backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`Backup completed! Saved to: ${backupPath}`);
  
  // Clean up
  admin.app().delete();
}

backupFirestore().catch(console.error); 