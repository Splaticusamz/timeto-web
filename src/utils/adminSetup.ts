import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserRoles } from '../types/organization';

export const setupAdminUser = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const adminRoles: UserRoles = {
    systemRole: 'system_admin',
    organizations: {},
  };
  
  try {
    await setDoc(userRef, adminRoles);
    console.log('Admin user setup completed');
    return true;
  } catch (error) {
    console.error('Failed to setup admin user:', error);
    return false;
  }
}; 