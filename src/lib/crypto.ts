"use server";

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import nacl from "tweetnacl";
import crypto from "crypto";

// Envelope encryption using Web Crypto API

async function encryptFile(fileData: ArrayBuffer, password: string) {
  // 1. Derive master key from password
  const salt: Uint8Array<ArrayBuffer> = crypto.getRandomValues(new Uint8Array(16));
  const masterKey = await deriveMasterKey(password, salt);

  // 2. Generate a random per-file AES key
  const fileKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 3. Encrypt the file with the file key
  const fileIv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBytes = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: fileIv },
    fileKey,
    fileData
  );

  // 4. Export and wrap the file key with the master key
  const rawFileKey = await crypto.subtle.exportKey("raw", fileKey);
  const keyWrapIv = crypto.getRandomValues(new Uint8Array(12));
  const wrappedFileKey = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: keyWrapIv },
    masterKey,
    rawFileKey
  );

  // 5. Return everything as JSON
  return {
    keyDerivation: {
      salt: intBufferToBase64(salt),
      iterations: 250_000,
      algorithm: "PBKDF2",
      hash: "SHA-256",
    },
    wrappedFileKey: bufferToBase64(wrappedFileKey),
    keyWrapIv: intBufferToBase64(keyWrapIv),
    fileEncryption: {
      iv: intBufferToBase64(fileIv),
      algorithm: "AES-GCM",
      ciphertext: bufferToBase64(cipherBytes),
    },
  };
}

// --- Helpers ---

function bufferToBase64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function intBufferToBase64(buf: Uint8Array<ArrayBuffer>) {
  return btoa(String.fromCharCode(...buf));
}

function base64ToBuffer(str: string) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

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
    publicKey: user.public_key,
    salt: user.pw_salt,
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
  const publicKey = Uint8Array.from(Buffer.from(user.public_key, "base64"));

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
