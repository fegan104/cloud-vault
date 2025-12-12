import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "./db";

/**
 * Create a session for a user by inserting a session into the database and setting a cookie.
 * @param userId The ID of the user to create a session for.
 */
export async function createSession(userId: string) {
  const sessionToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);//24 hours

  await prisma.session.create({
    data: { userId, sessionToken, expiresAt }
  });

  (await cookies()).set("session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    expires: expiresAt,
    path: "/"
  });
}

/**
 * Get the session token from the cookie.
 * @returns The session token or null if not found.
 */
export async function getSessionToken() {
  const sessionToken = (await cookies()).get("session")?.value;
  return sessionToken || null;
}

/**
 * Deletes the session cookie.
 */
export async function deleteSessionToken() {
  (await cookies()).delete("session")
}