import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

const corsHandler = cors({ origin: true });

export const checkOrganizationName = functions.https.onRequest(async (req, res) => {
  // Handle CORS
  return corsHandler(req, res, async () => {
    try {
      const { name } = req.body;
      if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }

      const db = admin.firestore();
      const snapshot = await db
        .collection('organizations')
        .get();

      // Check for case-insensitive matches
      const matches = snapshot.docs.filter(doc => 
        doc.data().name.toLowerCase() === name.toLowerCase()
      );

      res.status(200).json({ available: matches.length === 0 });
    } catch (error) {
      console.error('Error checking organization name:', error);
      res.status(500).json({ error: 'Failed to check organization name' });
    }
  });
}); 