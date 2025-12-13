"use server";
import { generateChallenge } from "@/lib/challenge/generateChallenge";
import { verifyChallenge } from "@/lib/challenge/verifyChallenge";
import { generateSalt, uint8ToBase64 } from "@/lib/clientCrypto";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session/createSessions";

/**
 * Generates a challenge for a user.
 * @param emailAddress - the user's email address
 * @returns an object containing the challenge and the user's master key salt
 */
export async function requestSignInChallenge(emailAddress: string) {
  // Find the user details by email address
  const user = await prisma.user.findUnique({
    where: {
      email: emailAddress,
    },
    select: {
      id: true,
      masterKeySalt: true
    },
  });

  //TODO we want to send back a deterministic salt if the user isn't found so we don't leak whether a user exists or not
  const masterKeySalt = user?.masterKeySalt || uint8ToBase64(generateSalt());

  // Generate an authentication challenge
  const record = await generateChallenge();

  return { challenge: record.challenge, masterKeySalt };
}

/**
 * Verify a client's signed challenge. If the signature is valid, we also set a session cookie.
 *
 * @param emailAddress - user's email (used to look up stored publicKey + optional masterKeySalt)
 * @param challengeFromClient - the plaintext challenge string that was signed
 * @param clientSignedChallenge - base64-encoded signature produced by client
 * @returns boolean - true if signature verifies, false otherwise
 */
export async function verifySignInChallenge(
  emailAddress: string,
  challengeFromClient: string,
  clientSignedChallenge: string
): Promise<boolean> {
  // 1) Find the user and their stored public key / salt
  const user = await prisma.user.findUnique({
    where: { email: emailAddress },
    select: { id: true, publicKey: true, masterKeySalt: true },
  });

  if (!user) {
    // no such user or missing public key
    return false;
  }

  const verified = await verifyChallenge(user.publicKey, challengeFromClient, clientSignedChallenge);

  if (!verified) {
    return false;
  }

  // signature valid now we can create a session
  await createSession(user.id);

  return true
}