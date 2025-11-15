"use server"
import { prisma } from '@/lib/db';
import crypto from 'crypto';

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