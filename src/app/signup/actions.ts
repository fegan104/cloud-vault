'use server';

import { createSession } from "@/lib/session/createSessions";
import { createUser as createUserDb } from "@/lib/user/createUser";
import * as opaqueServer from "@/lib/opaque/server";
import { User } from "@prisma/client";

/**
 * Step 1 of OPAQUE registration: Create a registration response.
 * The client sends a registrationRequest and receives a registrationResponse.
 * 
 * @param email - The user's email address
 * @param registrationRequest - The OPAQUE registration request from the client
 * @returns The registration response to send back to the client
 */
export async function createSignUpResponse(
  email: string,
  registrationRequest: string
): Promise<string> {
  return await opaqueServer.createSignUpResponse(email, registrationRequest);
}

/**
 * Step 2 of OPAQUE registration: Finish registration and create user.
 * The client sends the final registrationRecord.
 * 
 * @param email - The user's email address
 * @param registrationRecord - The OPAQUE registration record to store
 * @returns The created user or null if creation failed
 */
export async function createUser({
  email,
  registrationRecord,
}: {
  email: string;
  registrationRecord: string;
}): Promise<User | null> {
  try {
    const user = await createUserDb(email, registrationRecord);

    // Create session for newly created user
    await createSession(user.id);

    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}
