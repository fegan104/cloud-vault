import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
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
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
  });

const storage = getStorage(app).bucket();

/**
 * Generates a signed download URL for a file in Firebase Storage.
 * @param storagePath The path to the file in storage.
 * @returns A promise that resolves to the signed download URL.
 */
export async function getSignedDownloadUrl(storagePath: string): Promise<string> {
  const [url] = await storage.file(storagePath).getSignedUrl({
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });
  return url;
}

export async function getSignedUploadUrl(storagePath: string): Promise<string> {
  const [url] = await storage.file(storagePath).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: 'application/octet-stream',
  });
  return url;
}

export async function deleteFileFromCloudStorage(storagePath: string): Promise<void> {
  const fileRef = storage.file(storagePath);
  const [exists] = await fileRef.exists();
  if (exists) {
    await fileRef.delete();
  }
}

export async function doesFileExistInCloudStorage(storagePath: string): Promise<boolean> {
  const fileRef = storage.file(storagePath);
  const [exists] = await fileRef.exists();
  return exists;
}