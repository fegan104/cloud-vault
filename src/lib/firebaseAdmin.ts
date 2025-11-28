import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

// Load service account credentials from environment variables
const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
    credential: cert(serviceAccount),
    storageBucket: "web-encryption-7ac01.firebasestorage.app"
  });

export const adminAuth = getAuth(app);
export const storage = getStorage(app).bucket();
