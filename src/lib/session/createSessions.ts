"use server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/db";

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