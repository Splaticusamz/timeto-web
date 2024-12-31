import * as admin from 'firebase-admin';
import { checkOrganizationName } from './checkOrganizationName';

admin.initializeApp();

export { checkOrganizationName }; 