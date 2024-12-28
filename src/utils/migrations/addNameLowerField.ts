import { initializeApp } from 'firebase/app';
import { collection, getDocs, updateDoc, doc, getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const getEnvVar = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  return undefined;
};

const firebaseConfig = {
  apiKey: 'test-api-key',
  projectId: 'demo-project'
};

export async function migrateNameLowerField() {
  try {
    console.log('Starting nameLower field migration...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Connect to emulator
    connectFirestoreEmulator(db, 'localhost', 8081);
    
    const organizationsRef = collection(db, 'organizations');
    const snapshot = await getDocs(organizationsRef);
    
    console.log(`Found ${snapshot.size} organizations`);
    
    const updates = snapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data();
      console.log(`Processing organization: ${data.name}`);
      if (!data.nameLower && data.name) {
        const orgRef = doc(db, 'organizations', docSnapshot.id);
        await updateDoc(orgRef, {
          nameLower: data.name.toLowerCase()
        });
        console.log(`Updated organization ${docSnapshot.id} with nameLower: ${data.name.toLowerCase()}`);
      } else {
        console.log(`Organization ${docSnapshot.id} already has nameLower or no name`);
      }
    });

    await Promise.all(updates);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
} 