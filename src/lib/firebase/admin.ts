import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialiser Firebase Admin uniquement côté serveur
if (typeof window === 'undefined') {
  const firebaseAdminConfig = {
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  };

  // Initialize Firebase Admin
  if (getApps().length === 0) {
    initializeApp(firebaseAdminConfig);
  }
}

// Export admin Firestore instance
export const adminDb = getApps().length > 0 ? getFirestore() : null;