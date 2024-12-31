import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Set emulator host
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const app = initializeApp({
  projectId: 'timeto-69867'
});

const db = getFirestore(app);

async function checkRoles() {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    const roles = new Set();
    let userCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.systemRole) {
        roles.add(data.systemRole);
      }
      userCount++;
    });

    console.log('\n📊 System Roles Summary:');
    console.log('------------------------');
    console.log('Total users:', userCount);
    console.log('Unique roles found:', Array.from(roles));
    
    // Count users per role
    const roleCounts = {};
    snapshot.forEach(doc => {
      const role = doc.data().systemRole || 'no_role';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    console.log('\n👥 Users per role:');
    console.log('------------------------');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`${role}: ${count} users`);
    });

  } catch (error) {
    console.error('Error checking roles:', error);
  }
}

checkRoles(); 