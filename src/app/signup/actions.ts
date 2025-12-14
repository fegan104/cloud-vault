'use server';

import { prisma } from "../../lib/db";
import { createSession } from "@/lib/session/createSessions";
import { User } from "@prisma/client";

/**
 * Creates a new user in the database and then sets a session cookie that is valid for 24 hours.
 * @param {email, salt, publicKey} The user's email, master key salt, and public key.
 */
export async function createUser({ email, salt, publicKey }: {
  email: string;
  salt: string;
  publicKey: string
}): Promise<User | null> {
  try {
    const user = await prisma.user.create({
      data: { email, masterKeySalt: salt, publicKey },
    });

    // Create session for newly created user
    await createSession(user.id);

    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}
