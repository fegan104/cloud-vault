"use server"
import { prisma } from './db';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import nacl from "tweetnacl";
import { getUser } from './getUser';

export async function generateChallenge(emailAddress: string) {
  const challengeBytes = crypto.randomBytes(32);
  const challenge = challengeBytes.toString("base64");

  const user = await prisma.user.findUnique({
    where: {
      email: emailAddress,
    },
    select: {
      id: true,
      masterKeySalt: true
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Store it in the database
  const record = await prisma.challenge.create({
    data: {
      userId: user.id,
      challenge,
      expiresAt: addMinutes(5)
    },
  });

  return { challenge: record.challenge, masterKeySalt: user.masterKeySalt }; // send this to client
}

function addMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60_000);
}

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

/**
 * Verify a client's signed challenge for a share.
 * Uses the share's publicKey instead of the user's.
 *
 * @param shareId - the share ID to look up the publicKey
 * @param challengeFromClient - the plaintext challenge string that was signed
 * @param clientSignedChallenge - base64-encoded signature produced by client
 * @returns boolean - true if signature verifies, false otherwise
 */
export async function verifyChallengeForShare(
  shareId: string,
  challengeFromClient: string,
  clientSignedChallenge: string
): Promise<boolean> {
  const share = await prisma.share.findUnique({
    where: { id: shareId },
    select: { publicKey: true },
  });

  if (!share || !share.publicKey) {
    return false;
  }

  // Verify the challenge exists
  const challengeRecord = await prisma.challenge.findUnique({
    where: { challenge: challengeFromClient },
  });

  if (!challengeRecord) {
    return false;
  }

  if (challengeRecord.expiresAt < new Date()) {
    await prisma.challenge.delete({ where: { challenge: challengeFromClient } });
    return false;
  }

  const publicKeyBytes = base64ToUint8Array(share.publicKey);
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

/**
 * Verify a client's signed challenge.
 *
 * @param emailAddress - user's email (used to look up stored publicKey + optional masterKeySalt)
 * @param challengeFromClient - the plaintext challenge string that was signed
 * @param clientSignedChallenge - base64-encoded signature produced by client
 * @returns boolean - true if signature verifies, false otherwise
 */
export async function verifyChallenge(
  emailAddress: string,
  challengeFromClient: string,
  clientSignedChallenge: string
): Promise<boolean> {
  // 1) Find the user and their stored public key / salt
  const user = await prisma.user.findUnique({
    where: { email: emailAddress },
    select: { id: true, publicKey: true, masterKeySalt: true },
  });

  if (!user || !user.publicKey) {
    // no such user or missing public key
    return false;
  }

  // 2) Prepare public key and signature buffers
  // Expectation: user.publicKey is PEM (-----BEGIN PUBLIC KEY-----...).
  // If you store raw DER/base64, adapt createPublicKey below.
  // 2) Decode base64 public key from DB
  // 3) Import client public key into WebCrypto
  const publicKeyBytes = base64ToUint8Array(user.publicKey);
  const signatureBytes = base64ToUint8Array(clientSignedChallenge);

  // 5) Verify signature using Ed25519 (tweetnacl)
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(challengeFromClient); // EXACT bytes signed by client

  const verified = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes
  );


  if (!verified) throw new Error("Invalid signature");

  //
  // 6. Consume challenge
  //
  await prisma.challenge.delete({
    where: { challenge: challengeFromClient }
  });

  // signature valid → create session
  const sessionToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);//24 hours

  await prisma.session.create({
    data: { userId: user.id, sessionToken, expiresAt }
  });

  (await cookies()).set("session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    expires: expiresAt,
    path: "/"
  });

  //
  // 7. Return success + userId
  //
  return true
}