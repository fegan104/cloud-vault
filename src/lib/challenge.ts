"use server"
import { prisma } from './db';
import crypto from 'crypto';
import nacl from "tweetnacl";
import { getUser } from './user';

/**
 * Inserts a challenge into the database that is valid for the next 5 minutes.
 * @returns an object containing the challenge
 */
export async function generateChallenge() {
  const challengeBytes = crypto.randomBytes(32);
  const challenge = challengeBytes.toString("base64");

  // Store it in the database
  const record = await prisma.challenge.create({
    data: {
      challenge,
      expiresAt: addMinutes(5),
    },
  });

  return { challenge: record.challenge };
}


/**
 * Verify a client's signed challenge.
 *
 * @param publicKey - the public key to verify the signature with
 * @param challengeFromClient - the plaintext challenge string that was signed
 * @param clientSignedChallenge - base64-encoded signature produced by client
 * @returns boolean - true if signature verifies, false otherwise
 */
export async function verifyChallenge(
  publicKey: string,
  challengeFromClient: string,
  clientSignedChallenge: string
): Promise<boolean> {
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
  // Convert base64 to uint8array
  const publicKeyBytes = base64ToUint8Array(publicKey);
  const signatureBytes = base64ToUint8Array(clientSignedChallenge);

  // Verify signature
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(challengeFromClient);
  const verified = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes
  );


  if (!verified) throw new Error("Invalid signature");

  //Consume challenge so it cannot be reused
  await prisma.challenge.delete({
    where: { challenge: challengeFromClient }
  });

  return true
}

function addMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60_000);
}

function base64ToUint8Array(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}