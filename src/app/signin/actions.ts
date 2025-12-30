"use server";

import { createSession } from "@/lib/session/createSessions";
import { getUserByEmail } from "@/lib/user/getUserByEmail";
import { upsertEphemeral, getEphemeral, deleteEphemeral } from "@/lib/opaque/ephemeral";
import * as opaqueServer from "@/lib/opaque/server";

/**
 * Step 1 of OPAQUE login: Start the login process.
 * Returns the login response and stores server state as ephemeral.
 * 
 * @param email - The user's email address
 * @param startLoginRequest - The OPAQUE start login request from the client
 * @returns The login response, or null if user not found
 */
export async function createSignInResponse(
  email: string,
  startLoginRequest: string
): Promise<{ loginResponse: string } | null> {
  // Find the user and their registration record
  const user = await getUserByEmail(email);

  if (!user || !user.opaqueRegistrationRecord) {
    return null;
  }

  // Start the OPAQUE login
  const { loginResponse, serverLoginState } = await opaqueServer.createSignInResponse(
    email,
    user.opaqueRegistrationRecord,
    startLoginRequest
  );

  // Store the server login state as ephemeral (expires in 5 minutes)
  await upsertEphemeral(email, serverLoginState);

  return { loginResponse };
}

/**
 * Step 2 of OPAQUE login: Finish the login process.
 * Verifies the login and creates a session.
 * 
 * @param email - The user's email address
 * @param finishLoginRequest - The OPAQUE finish login request from the client
 * @returns True if login successful, false otherwise
 */
export async function finishSignIn(
  email: string,
  finishLoginRequest: string
): Promise<boolean> {
  // Get the stored ephemeral state
  const ephemeral = await getEphemeral(email);

  if (!ephemeral || ephemeral.expiresAt < new Date()) {
    // Ephemeral not found or expired
    if (ephemeral) {
      await deleteEphemeral(ephemeral.id);
    }
    return false;
  }

  // Finish the OPAQUE login
  const sessionKey = await opaqueServer.finishSignIn(
    ephemeral.serverLoginState,
    finishLoginRequest
  );

  // Clean up the ephemeral
  await deleteEphemeral(ephemeral.id);

  if (!sessionKey) {
    return false;
  }

  // Find the user and create a session
  const user = await getUserByEmail(email);

  if (!user) {
    return false;
  }

  await createSession(user.id);
  return true;
}