import { prisma } from '../db';
import crypto from 'crypto';

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

function addMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60_000);
}