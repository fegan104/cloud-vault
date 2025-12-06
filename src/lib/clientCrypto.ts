"use client"
import nacl from "tweetnacl";
import { argon2id } from "hash-wasm";

const ARGON2_MEMORY_SIZE = 131_072; // 128 MB
const ARGON2_ITERATIONS = 4;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LENGTH = 32;

export async function deriveKeypair(password: string, salt: Uint8Array<ArrayBuffer>) {
  const seedHex = await argon2id({
    password,
    salt,
    parallelism: ARGON2_PARALLELISM,
    iterations: ARGON2_ITERATIONS,
    memorySize: ARGON2_MEMORY_SIZE,
    hashLength: ARGON2_HASH_LENGTH,
    outputType: "hex",
  });

  // Convert hex string to Uint8Array
  const seed = new Uint8Array(
    seedHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  // Convert seed → Ed25519 keypair using TweetNaCl
  const keypair = nacl.sign.keyPair.fromSeed(seed);

  return {
    publicKey: keypair.publicKey,
    privateKey: keypair.secretKey
  };
}

export async function signChallenge(
  password: string,
  masterKeySaltB64: string,
  challenge: string
) {
  const encoder = new TextEncoder();

  // 1. derive master key (HMAC key)
  const keyPairs = await deriveKeypair(password, base64ToUint8Array(masterKeySaltB64))
  const messageBytes = encoder.encode(challenge);
  const sig = nacl.sign.detached(messageBytes, keyPairs.privateKey);
  return uint8ToBase64(sig);
}

export async function signShareChallenge(
  privateKey: Uint8Array,
  challenge: string
) {
  const encoder = new TextEncoder();

  // 1. derive master key (HMAC key)
  const messageBytes = encoder.encode(challenge);
  const sig = nacl.sign.detached(messageBytes, privateKey);
  return uint8ToBase64(sig);
}

export function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64); // Decode the Base64 string to a binary string
  const len = binaryString.length;
  const bytes = new Uint8Array(len); // Create a new Uint8Array with the same length

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i); // Populate the Uint8Array with byte values
  }

  return bytes;
}

export async function deriveMasterKey(password: string, salt: Uint8Array) {
  const keyHex = await argon2id({
    password,
    salt,
    parallelism: ARGON2_PARALLELISM,
    iterations: ARGON2_ITERATIONS,
    memorySize: ARGON2_MEMORY_SIZE,
    hashLength: ARGON2_HASH_LENGTH,
    outputType: "hex",
  });

  const keyBytes = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );
}

export async function decryptFile(
  encryptedBlob: Blob,
  masterKey: CryptoKey,
  metadata: {
    fileIv: string;
    wrappedFileKey: string;
    keyWrapIv: string;
  }
): Promise<Blob> {
  // 1. Unwrap the file key using the master key
  const wrappedKeyBytes = base64ToUint8Array(metadata.wrappedFileKey);
  const keyWrapIvBytes = base64ToUint8Array(metadata.keyWrapIv);

  const fileKey = await crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBytes,
    masterKey,
    { name: "AES-GCM", iv: keyWrapIvBytes },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Decrypt the file content
  const fileIvBytes = base64ToUint8Array(metadata.fileIv);
  const encryptedBuffer = await encryptedBlob.arrayBuffer();

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fileIvBytes },
    fileKey,
    encryptedBuffer
  );

  return new Blob([decryptedBuffer]);
}

export async function encryptFile(
  file: File,
  masterKey: CryptoKey,
  masterKeySalt: string
) {
  const fileBuffer = await file.arrayBuffer();

  // 1. Generate a random file key
  const fileKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // 2. Encrypt the file with the file key
  const fileIv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: fileIv },
    fileKey,
    fileBuffer
  );

  // 3. Wrap the file key with the master key
  const keyWrapIv = window.crypto.getRandomValues(new Uint8Array(12));
  const wrappedFileKey = await window.crypto.subtle.wrapKey(
    "raw",
    fileKey,
    masterKey,
    { name: "AES-GCM", iv: keyWrapIv }
  );

  // 4. Prepare metadata
  const metadata = {
    fileIv: uint8ToBase64(fileIv),
    wrappedFileKey: uint8ToBase64(new Uint8Array(wrappedFileKey)),
    keyWrapIv: uint8ToBase64(keyWrapIv),
    fileAlgorithm: 'AES-GCM',
    keyDerivationSalt: masterKeySalt,
    argon2MemorySize: ARGON2_MEMORY_SIZE,
    argon2Iterations: ARGON2_ITERATIONS,
    argon2Parallelism: ARGON2_PARALLELISM,
    argon2HashLength: ARGON2_HASH_LENGTH,
  };

  const encryptedFileBlob = new Blob([encryptedContent], { type: 'application/octet-stream' });

  return {
    encryptedFileBlob,
    metadata
  };
}


/**
 * Derives a new CryptoKey from a password and salt using argon2id
 */
export async function deriveShareKey(
  sharePassword: string,
  shareSalt: Uint8Array
): Promise<{
  shareKey: CryptoKey;
  publicKey: string;
  privateKey: string;
  metadata: {
    argon2MemorySize: number;
    argon2Iterations: number;
    argon2Parallelism: number;
    argon2HashLength: number;
  };
}> {
  const keyHex = await argon2id({
    password: sharePassword,
    salt: shareSalt,
    parallelism: ARGON2_PARALLELISM,
    iterations: ARGON2_ITERATIONS,
    memorySize: ARGON2_MEMORY_SIZE,
    hashLength: ARGON2_HASH_LENGTH,
    outputType: "hex",
  });

  const keyBytes = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const shareKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );

  // Convert seed → Ed25519 keypair using TweetNaCl
  const keypair = nacl.sign.keyPair.fromSeed(keyBytes);

  return {
    shareKey,
    publicKey: uint8ToBase64(keypair.publicKey),
    privateKey: uint8ToBase64(keypair.secretKey),
    metadata: {
      argon2MemorySize: ARGON2_MEMORY_SIZE,
      argon2Iterations: ARGON2_ITERATIONS,
      argon2Parallelism: ARGON2_PARALLELISM,
      argon2HashLength: ARGON2_HASH_LENGTH,
    },
  };
}

/**
 * Unwraps a file key with a master key, wraps the file key with the new share key.
 * 
 * @param wrappedFileKey The wrapped file key to unwrap (base64 encoded)
 * @param keyWrapIv The IV used to wrap the file key (base64 encoded)
 * @param masterKey The master key to unwrap the file key with
 * @param shareKey The share key to wrap the file key with
 * 
 * @returns The file key wrapped with the share key, and the metadata used for the share key wrapping
 */
export async function wrapShareKey(
  wrappedFileKey: string,
  keyWrapIv: string,
  masterKey: CryptoKey,
  shareKey: CryptoKey
): Promise<{
  wrappedFileKey: string;
  keyWrapIv: string;
}> {
  // 1. Unwrap the file key using the master key
  const wrappedKeyBytes = base64ToUint8Array(wrappedFileKey);
  const keyWrapIvBytes = base64ToUint8Array(keyWrapIv);

  const fileKey = await crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBytes,
    masterKey,
    { name: "AES-GCM", iv: keyWrapIvBytes },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Generate a new IV for wrapping with the share key
  const shareKeyWrapIv = crypto.getRandomValues(new Uint8Array(12));

  // 3. Wrap the file key with the share key
  const rewrappedFileKey = await crypto.subtle.wrapKey(
    "raw",
    fileKey,
    shareKey,
    { name: "AES-GCM", iv: shareKeyWrapIv }
  );

  return {
    wrappedFileKey: uint8ToBase64(new Uint8Array(rewrappedFileKey)),
    keyWrapIv: uint8ToBase64(shareKeyWrapIv),
  };
}

export function uint8ToBase64(u8: Uint8Array): string {
  // Convert bytes → binary string → base64
  let binary = "";
  for (let i = 0; i < u8.length; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  return btoa(binary);
}