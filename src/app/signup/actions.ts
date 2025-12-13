'use server';

import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "../../lib/db";

/**
 * Creates a new user in the database and then sets a session cookie that is valid for 24 hours.
 * @param {email, salt, publicKey} The user's email, master key salt, and public key.
 */
export async function createUser({ email, salt, publicKey }: {
  email: string;
  salt: string;
  publicKey: string
}) {
  const user = await prisma.user.create({
    data: { email, masterKeySalt: salt, publicKey },
  });

  // Create session
  const sessionToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.session.create({
    data: { userId: user.id, sessionToken, expiresAt },
  });

  (await cookies()).set("session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}
