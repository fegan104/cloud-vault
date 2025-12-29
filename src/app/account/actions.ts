"use server";

import { deleteSessionToken } from "@/lib/session/deleteSessionsToken";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/user/getUser";
import { updateEncryptedFilesTransaction } from "@/lib/user/updateUser";
import { getEncryptedFilesForUser } from "@/lib/file/getEncryptedFile";
import { revalidatePath } from "next/cache";
import * as opaqueServer from "@/lib/opaque/server";

/**
 * Creates an OPAQUE registration response for password change.
 * Used when the user is changing their master password.
 * 
 * @param registrationRequest - The OPAQUE registration request from the client
 * @returns The registration response to send back to the client
 */
export async function createSignUpResponse(
  registrationRequest: string
): Promise<string> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return await opaqueServer.createSignUpResponse(user.email, registrationRequest);
}

/**
 * Creates an OPAQUE registration response for email change.
 * Used when the user is changing their account email.
 * 
 * @param email - The new email address
 * @param registrationRequest - The OPAQUE registration request from the client
 * @returns The registration response to send back to the client
 */
export async function createUpdateEmailSignUpResponse(
  email: string,
  registrationRequest: string
): Promise<string> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return await opaqueServer.createSignUpResponse(email, registrationRequest);
}

/**
 * Signs out the user. This deletes the session cookie and removes 
 * the session from the database. Then redirects to the home page.
 */
export async function signOut() {
  await deleteSessionToken();
  redirect("/");
}

/**
 * Updates the user's email and registration record.
 * @param email The new email address.
 * @param registrationRecord The new OPAQUE registration record.
 * @returns true if the update was successful, false otherwise.
 */
export async function updateEmail(email: string, registrationRecord: string): Promise<boolean> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { updateUserEmailAndRegistration } = await import("@/lib/user/updateUser");
  await updateUserEmailAndRegistration(user.id, email, registrationRecord);

  revalidatePath("/account");

  return true;
}

// Returns the necessary data to decrypt and re-encrypt the file keys
export async function getAllEncryptedFilesKeyDerivationParams(): Promise<{ id: string; wrappedFileKey: string; keyWrapNonce: string; }[]> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return await getEncryptedFilesForUser(user.id);
}

// Updates the encrypted file key derivation params in the database
// This should be done in a transaction
export async function updateEncryptedFilesKeyDerivationParams(
  updates: { id: string; wrappedFileKey: string; keyWrapNonce: string }[],
  opaqueRegistrationRecord: string
) {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await updateEncryptedFilesTransaction(user.id, updates, opaqueRegistrationRecord);

  revalidatePath("/account");

  return true;
}
