"use client"
import nacl from "tweetnacl";
import { argon2id } from "hash-wasm";

const ARGON2_MEMORY_SIZE = 131_072; // 128 MB
const ARGON2_ITERATIONS = 4;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LENGTH = 32;

export function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

export function generateIv() {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Derives a stable public/private keypair from a password and salt using argon2id. 
 * TODO maybe make a diffferent function that takes th emaster key as input
 * @param password - the password to derive the keypair from
 * @param salt - the salt to use for the keypair derivation
 * @returns an object containing the public and private key
 */
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

  const keypair = nacl.sign.keyPair.fromSeed(seed);

  return {
    publicKey: keypair.publicKey,
    privateKey: keypair.secretKey
  };
}

/**
 * Signs a challenge using the client's private key
 * @param password - the password to derive the keypair from
 * @param masterKeySaltB64 - the salt to use for the keypair derivation
 * @param challenge - the challenge to sign
 * @returns the signature
 */
export async function signChallenge(
  password: string,
  masterKeySaltB64: string,
  challenge: string
) {
  const encoder = new TextEncoder();

  // derive the private key using the master password and salt
  const { privateKey } = await deriveKeypair(password, base64ToUint8Array(masterKeySaltB64))
  const messageBytes = encoder.encode(challenge);
  const sig = nacl.sign.detached(messageBytes, privateKey);
  return uint8ToBase64(sig);
}

/**
 * Signs a challenge using the client's private key
 * @param privateKey - the private key to sign the challenge with
 * @param challenge - the challenge to sign
 * @returns the signature
 */
export async function signShareChallenge(
  privateKey: Uint8Array,
  challenge: string
) {
  const encoder = new TextEncoder();

  // sign the challenge using the private key
  const messageBytes = encoder.encode(challenge);
  const sig = nacl.sign.detached(messageBytes, privateKey);
  return uint8ToBase64(sig);
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

/**
 * Unwraps a file key using the provided wrapping key (master key or share key).
 * 
 * @param wrappedFileKey The wrapped file key (base64 encoded)
 * @param keyWrapIv The IV used to wrap the file key (base64 encoded)
 * @param wrappingKey The key to unwrap the file key with (master key or share key)
 * 
 * @returns The unwrapped file key as a CryptoKey
 */
export async function unwrapFileKey(
  wrappedFileKey: string,
  keyWrapIv: string,
  wrappingKey: CryptoKey
): Promise<CryptoKey> {
  const wrappedKeyBytes = base64ToUint8Array(wrappedFileKey);
  const keyWrapIvBytes = base64ToUint8Array(keyWrapIv);

  return crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBytes,
    wrappingKey,
    { name: "AES-GCM", iv: keyWrapIvBytes },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
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
  const fileIv = generateIv();
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: fileIv },
    fileKey,
    fileBuffer
  );

  // 3. Wrap the file key with the master key
  const keyWrapIv = generateIv();
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
 * @param sharePassword - the password to derive the key from
 * @param shareSalt - the salt to use for the key derivation
 * @returns an object containing the share key used for unwrapping 
 * shared file keys, public key, private key, and key derivation metadata
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
  const shareKeyWrapIv = generateIv();

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

export function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64); // Decode the Base64 string to a binary string
  const len = binaryString.length;
  const bytes = new Uint8Array(len); // Create a new Uint8Array with the same length

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i); // Populate the Uint8Array with byte values
  }

  return bytes;
}