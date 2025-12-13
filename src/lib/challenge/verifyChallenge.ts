import { base64ToUint8Array } from '../arrayHelpers';
import { prisma } from '../db';
import nacl from "tweetnacl";

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
