"use server"
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function createUser({ email, salt, publicKey }: { email: string; salt: string; publicKey: string }) {
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