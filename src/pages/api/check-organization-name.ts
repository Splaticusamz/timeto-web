import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Query for organizations with the same name (case-insensitive)
    const snapshot = await db
      .collection('organizations')
      .where('name', '==', name)
      .get();

    // Also check for case-insensitive matches
    const matches = snapshot.docs.filter(doc => 
      doc.data().name.toLowerCase() === name.toLowerCase()
    );

    return res.status(200).json({ available: matches.length === 0 });
  } catch (error) {
    console.error('Error checking organization name:', error);
    return res.status(500).json({ error: 'Failed to check organization name' });
  }
} 