"use server"

import { getShareById } from "@/lib/share/getShareById";
import { getSignedDownloadUrl } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/db";
import { generateChallenge } from "@/lib/challenge/generateChallenge";
import { verifyChallenge } from "@/lib/challenge/verifyChallenge";

/**
 * Get a signed URL for a share that can be used to download the file.
 * @param shareId The uniqueID of the share to get.
 * @returns The download URL for the share. */
export async function getShareDownloadUrl(shareId: string): Promise<string> {
  const share = await getShareById(shareId);

  if (!share || !share.file) {
    throw new Error("Share or file not found");
  }

  return await getSignedDownloadUrl(share.file.storagePath);
}

/**
 * Generates a challenge for granting access to a share.
 * @param shareId - the share's unique ID
 * @returns an object containing the challenge and the share's key derivation parameters
 */
export async function generateChallengeForShare(shareId: string) {
  const shareKeyDerivationParams = await prisma.share.findUnique({
    where: { id: shareId },
    select: {
      name: true,
      publicKey: true,
      keyDerivationSalt: true,
      argon2MemorySize: true,
      argon2Iterations: true,
      argon2Parallelism: true,
      argon2HashLength: true,
    }
  });

  if (!shareKeyDerivationParams) {
    throw new Error("Share not found");
  }

  // Store it in the database
  const record = await generateChallenge();

  return { challenge: record.challenge, shareKeyDerivationParams };
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

  if (!share) {
    return false;
  }

  return await verifyChallenge(share.publicKey, challengeFromClient, clientSignedChallenge);
}