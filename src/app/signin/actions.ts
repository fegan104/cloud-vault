"use server";

import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session/createSessions";
import * as opaqueServer from "@/lib/opaque";

/**
 * Step 1 of OPAQUE login: Start the login process.
 * Returns the login response and stores server state as ephemeral.
 * 
 * @param email - The user's email address
 * @param startLoginRequest - The OPAQUE start login request from the client
 * @returns The login response, or null if user not found
 */
export async function startLogin(
  email: string,
  startLoginRequest: string
): Promise<{ loginResponse: string } | null> {
  // Find the user and their registration record
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      opaqueRegistrationRecord: true,
    },
  });

  if (!user || !user.opaqueRegistrationRecord) {
    return null;
  }

  // Start the OPAQUE login
  const { loginResponse, serverLoginState } = await opaqueServer.startLogin(
    email,
    user.opaqueRegistrationRecord,
    startLoginRequest
  );

  // Store the server login state as ephemeral (expires in 5 minutes)
  await prisma.opaqueEphemeral.upsert({
    where: { userIdentifier: email },
    update: {
      serverLoginState,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
    create: {
      userIdentifier: email,
      serverLoginState,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

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
export async function finishLogin(
  email: string,
  finishLoginRequest: string
): Promise<boolean> {
  // Get the stored ephemeral state
  const ephemeral = await prisma.opaqueEphemeral.findUnique({
    where: { userIdentifier: email },
  });

  if (!ephemeral || ephemeral.expiresAt < new Date()) {
    // Ephemeral not found or expired
    if (ephemeral) {
      await prisma.opaqueEphemeral.delete({
        where: { id: ephemeral.id },
      });
    }
    return false;
  }

  // Finish the OPAQUE login
  const sessionKey = await opaqueServer.finishLogin(
    ephemeral.serverLoginState,
    finishLoginRequest
  );

  // Clean up the ephemeral
  await prisma.opaqueEphemeral.delete({
    where: { id: ephemeral.id },
  });

  if (!sessionKey) {
    return false;
  }

  // Find the user and create a session
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return false;
  }

  await createSession(user.id);
  return true;
}