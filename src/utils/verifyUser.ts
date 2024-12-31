import { getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { fetchSignInMethodsForEmail } from 'firebase/auth';

export const verifyUser = async (email: string) => {
  try {
    // Check Auth
    const methods = await fetchSignInMethodsForEmail(auth, email);
    console.log('🔍 Auth Check:', {
      email,
      exists: methods.length > 0,
      methods
    });

    // Get current user from auth state
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('❌ No user found in auth state');
      return {
        auth: { exists: false, user: null },
        firestore: { exists: false, data: null }
      };
    }

    console.log('👤 Auth User:', {
      uid: currentUser.uid,
      email: currentUser.email,
      emailVerified: currentUser.emailVerified,
      displayName: currentUser.displayName,
      createdAt: currentUser.metadata.creationTime,
    });

    // Check Firestore
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    console.log('📄 Firestore Check:', {
      exists: userDoc.exists(),
      data: userDoc.exists() ? userDoc.data() : null
    });

    return {
      auth: {
        exists: true,
        user: currentUser
      },
      firestore: {
        exists: userDoc.exists(),
        data: userDoc.data()
      }
    };
  } catch (error) {
    console.error('Error verifying user:', error);
    throw error;
  }
}; 