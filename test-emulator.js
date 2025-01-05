import admin from 'firebase-admin';

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const app = admin.initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'timeto-69867' });
const db = admin.firestore();

let lastCreatedOrgId = null;
const startTime = admin.firestore.Timestamp.now().toMillis();

async function testDatabaseOperations() {
  try {
    console.log('\n🕒 Script started at:', new Date(startTime).toISOString());

    // Watch organizations
    db.collection('organizations')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            lastCreatedOrgId = change.doc.id;
            console.log('\n🏢 New organization added:', {
              id: change.doc.id,
              owner: data.ownerId,
              name: data.name
            });
          } else if (change.type === 'modified') {
            console.log('\n📝 Organization updated:', change.doc.id);
          } else if (change.type === 'removed') {
            console.log('\n🗑️ Organization deleted:', change.doc.id);
          }
        });
      });

    // Watch private events
    db.collection('events')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            console.log('\n📅 New private event added:', {
              id: change.doc.id,
              orgId: data.organizationId,
              shouldBeOrgId: lastCreatedOrgId,
              title: data.title
            });
          } else if (change.type === 'modified') {
            console.log('\n📝 Private event updated:', change.doc.id);
          } else if (change.type === 'removed') {
            console.log('\n🗑️ Private event deleted:', change.doc.id);
          }
        });
      });

    console.log('\n👀 Watching for all changes...');
    console.log('Press Ctrl+C to stop');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDatabaseOperations();
