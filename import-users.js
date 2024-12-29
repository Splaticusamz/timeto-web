import { readFileSync } from 'fs';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Initialize Firebase Admin with emulator
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081';
initializeApp({ projectId: 'timeto-69867' });

// Read the auth export file
const authData = JSON.parse(readFileSync('./auth_export.json'));
console.log('Loaded auth data:', authData.users);

async function importUsers() {
    const auth = getAuth();
    const db = getFirestore();
    
    for (const user of authData.users) {
        try {
            console.log('\nProcessing user:', user);
            
            // Create Auth user
            await auth.createUser({
                uid: user.localId,
                email: user.email,
                phoneNumber: user.phoneNumber,
                emailVerified: user.emailVerified || false,
                disabled: user.disabled || false,
                displayName: user.displayName
            });
            console.log('Created auth user:', user.localId);

            // Create Firestore user document matching the exact structure the component expects
            const userData = {
                auth: {
                    // The component specifically looks for auth.email
                    email: user.email || null,
                    phoneNumber: user.phoneNumber || null,
                    displayName: user.displayName || null
                },
                // These fields are used in the member list display
                firstName: '',
                lastName: '',
                email: user.email || null,
                phoneNumber: user.phoneNumber || null,
                systemRole: user.customAttributes?.publicOrgAdmin ? 'system_admin' : 'user',
                organizations: {},
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Set first/last name if we have a display name
            if (user.displayName) {
                const nameParts = user.displayName.split(' ');
                userData.firstName = nameParts[0] || '';
                userData.lastName = nameParts.slice(1).join(' ') || '';
            }

            console.log('Creating Firestore document with data:', userData);
            await db.collection('users').doc(user.localId).set(userData);
            console.log('Created Firestore document for:', user.localId);

            // Verify the document was created
            const docRef = await db.collection('users').doc(user.localId).get();
            console.log('Verified document exists:', docRef.exists);
            console.log('Document data:', docRef.data());

        } catch (error) {
            console.error(`Failed to import user: ${user.email || user.phoneNumber}`, error);
        }
    }

    // List all users in Firestore after import
    console.log('\nListing all users in Firestore:');
    const snapshot = await db.collection('users').get();
    snapshot.forEach(doc => {
        console.log('User document:', doc.id, doc.data());
    });
}

importUsers().then(() => console.log('Done!')).catch(console.error);