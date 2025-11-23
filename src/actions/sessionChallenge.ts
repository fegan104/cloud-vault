"use server";

import { prisma } from "@/lib/db";
import { getUser } from "@/lib/getUser";
import crypto from "crypto";
import nacl from "tweetnacl";

function base64ToUint8Array(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export async function generateChallengeForSession() {
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const challengeBytes = crypto.randomBytes(32);
  const challenge = challengeBytes.toString("base64");

  // Store it in the database
  const record = await prisma.challenge.create({
    data: {
      userId: user.id,
      challenge,
      expiresAt: new Date(Date.now() + 5 * 60_000), // 5 minutes
    },
  });

  return { challenge: record.challenge };
}

export async function verifyChallengeForSession(
  challengeFromClient: string,
  clientSignedChallenge: string
): Promise<boolean> {
  const user = await getUser();
  if (!user || !user.publicKey) {
    return false;
  }

  // Verify the challenge exists and belongs to the user
  const challengeRecord = await prisma.challenge.findUnique({
    where: { challenge: challengeFromClient },
  });

  if (!challengeRecord || challengeRecord.userId !== user.id) {
    return false;
  }

  if (challengeRecord.expiresAt < new Date()) {
    await prisma.challenge.delete({ where: { challenge: challengeFromClient } });
    return false;
  }

  const publicKeyBytes = base64ToUint8Array(user.publicKey);
  const signatureBytes = base64ToUint8Array(clientSignedChallenge);

  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(challengeFromClient);

  const verified = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes
  );

  if (verified) {
    await prisma.challenge.delete({
      where: { challenge: challengeFromClient },
    });
  }

  return verified;
}
