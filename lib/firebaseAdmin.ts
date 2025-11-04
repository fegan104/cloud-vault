import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import path from "path";
import fs from "fs";

const serviceAccountPath = path.join(process.cwd(), "serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error("Missing serviceAccountKey.json. Please add your Firebase service account file.");
}

const raw = fs.readFileSync(serviceAccountPath, "utf-8");

// Use a stricter type to ensure all required fields exist
const serviceAccount: ServiceAccount = JSON.parse(raw) as ServiceAccount;

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
    });

export const adminAuth = getAuth(app);
