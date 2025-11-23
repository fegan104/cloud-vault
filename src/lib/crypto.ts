"use server";

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import nacl from "tweetnacl";
import crypto from "crypto";

export async function getChallenge(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const challenge = crypto.randomBytes(32).toString("base64url");

  // store challenge temporarily in DB or Redis
  await prisma.challenge.create({
    data: {
      userId: user.id,
      challenge,
      expiresAt: new Date(Date.now() + 5 * 60_000) // 5 minutes
    }
  });

  return {
    userId: user.id,
    publicKey: user.publicKey,
    salt: user.masterKeySalt,
    challenge
  };
}

export async function verifySignature(
  userId: string,
  signatureBase64: string
) {
  const challenge = await prisma.challenge.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  if (!challenge || challenge.expiresAt < new Date()) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const signature = Uint8Array.from(Buffer.from(signatureBase64, "base64"));
  const publicKey = Uint8Array.from(Buffer.from(user.publicKey, "base64"));

  const ok = nacl.sign.detached.verify(
    new TextEncoder().encode(challenge.challenge),
    signature,
    publicKey
  );

  if (!ok) return null;

  // signature valid → create session
  const sessionToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);

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

  return { success: true };
}
