'use server';

import { prisma } from "../../lib/db";
import { createSession } from "@/lib/session/createSessions";
import { User } from "@prisma/client";
import * as opaqueServer from "@/lib/opaque";

/**
 * Step 1 of OPAQUE registration: Create a registration response.
 * The client sends a registrationRequest and receives a registrationResponse.
 * 
 * @param email - The user's email address
 * @param registrationRequest - The OPAQUE registration request from the client
 * @returns The registration response to send back to the client
 */
export async function startRegistration(
  email: string,
  registrationRequest: string
): Promise<string> {
  return opaqueServer.createRegistrationResponse(email, registrationRequest);
}

/**
 * Step 2 of OPAQUE registration: Finish registration and create user.
 * The client sends the final registrationRecord.
 * 
 * @param email - The user's email address
 * @param registrationRecord - The OPAQUE registration record to store
 * @returns The created user or null if creation failed
 */
export async function finishRegistration({
  email,
  registrationRecord,
}: {
  email: string;
  registrationRecord: string;
}): Promise<User | null> {
  try {
    const user = await prisma.user.create({
      data: {
        email,
        opaqueRegistrationRecord: registrationRecord,
      },
    });

    // Create session for newly created user
    await createSession(user.id);

    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}
