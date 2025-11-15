"use server"
import { prisma } from '@/lib/db';
import crypto from "crypto";
import { cookies } from 'next/headers';
import nacl from "tweetnacl";


// export async function verifyChallenge(
//   emailAddress: string,
//   clientSignedChallenge: string
// ) {
//   //
//   // 1. Fetch user
//   //
//   const user = await prisma.user.findUnique({
//     where: { email: emailAddress },
//     select: { id: true, publicKey: true }
//   });

//   if (!user) throw new Error("User not found");

//   //
//   // 2. Fetch challenge
//   //
//   const challenge = await prisma.challenge.findFirst({
//     where: { userId: user.id },
//     orderBy: { createdAt: "desc" }
//   });

//   if (!challenge) throw new Error("Challenge not found or mismatch");
//   if (challenge.expiresAt < new Date()) throw new Error("Challenge expired");
//   console.log(`Challenged = ${challenge}`)

//   //
//   // 3. Convert strings to ArrayBuffers
//   //
//   const encoder = new TextEncoder();

//   const challengeBytes = encoder.encode(challenge);

//   // clientSignedChallenge: base64 string → Uint8Array
//   const signatureBytes = Uint8Array.from(
//     Buffer.from(clientSignedChallenge, "base64")
//   );

//   //
//   // 4. Import user's public key
//   //    (Assuming Ed25519 raw public key stored as base64)
//   //
//   const publicKeyBytes = Uint8Array.from(
//     Buffer.from(user.publicKey, "base64")
//   );

//   const cryptoKey = await crypto.subtle.importKey(
//     "raw",
//     publicKeyBytes,
//     { name: "Ed25519", namedCurve: "Ed25519" },
//     false,
//     ["verify"]
//   );

//   //
//   // 5. Verify signature
//   //
//   const verified = await crypto.subtle.verify(
//     "Ed25519",
//     cryptoKey,
//     signatureBytes,
//     challengeBytes
//   );

//   if (!verified) throw new Error("Invalid signature");

//   //
//   // 6. Consume challenge (important!)
//   //
//   await prisma.challenge.delete({
//     where: { id: challenge.id }
//   });

//   // signature valid → create session
//   const sessionToken = crypto.randomBytes(32).toString("base64url");
//   const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);

//   await prisma.session.create({
//     data: { userId: user.id, sessionToken, expiresAt }
//   });

//   (await cookies()).set("session", sessionToken, {
//     httpOnly: true,
//     secure: true,
//     sameSite: "lax",
//     expires: expiresAt,
//     path: "/"
//   });

//   //
//   // 7. Return success + userId
//   //
//   return {
//     verified: true,
//     user: user.id
//   };
// }

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
  console.log(`${JSON.stringify({challengeFromClient, clientSignedChallenge, publicKey: user.publicKey})}`)
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
  // 6. Consume challenge (important!)
  //
  await prisma.challenge.delete({
    where: { challenge: challengeFromClient }
  });

  // signature valid → create session
  const sessionToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);

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

function base64ToUint8Array(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}