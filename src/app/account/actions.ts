"use server";

import { deleteSessionToken } from "@/lib/session/deleteSessionsToken";
import { redirect } from "next/navigation";

/**
 * Signs out the user. This deletes the session cookie and removes 
 * the session from the database. Then redirects to the home page.
 */
export async function signOut() {
  await deleteSessionToken();
  redirect("/");
}

/**
 * Updates the user's email.
 * @param email The new email address.
 * @returns true if the update was successful, false otherwise.
 */
export async function updateEmail(email: string): Promise<boolean> {
  return true;
}

// export async function getAllEncryptedFilesKeyDerivationParams() {

// }

// export async function updateEncryptedFilesKeyDerivationParams() {

// }

// export async function updateMasterPassword(oldMasterKey: CryptoKey, newPassword: string) {
// //get all encrypted files key derivation params
// //decrypt file wrap key with old master key
// //encrypt them with new master key
// //update file 's key derivation params in the db
// }
