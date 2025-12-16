import nacl from "tweetnacl";
import { argon2id } from "hash-wasm";
import { base64ToUint8Array, uint8ToBase64 } from "./arrayHelpers";
import { generateIv, generateSalt } from "./cryptoHelpers";
export { generateIv, generateSalt };

const ARGON2_MEMORY_SIZE = 131_072; // 128 MB
const ARGON2_ITERATIONS = 4;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LENGTH = 32;


/**
 * Derives a stable public/private keypair from a password and salt using argon2id. 
 * @param password - the password to derive the keypair from
 * @param salt - the salt to use for the keypair derivation
 * @returns an object containing the public and private key
 */
export async function deriveKeypair(password: string, salt: Uint8Array<ArrayBuffer>) {
  const keyBits = await deriveKeyBits(password, salt);
  const keypair = nacl.sign.keyPair.fromSeed(keyBits);

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

/**
 * Derives a master key from a password and salt using argon2id
 * @param masterPassword - the password to derive the key from
 * @param masterKeySalt - the salt to use for the key derivation
 * @returns the master key imported into the CryptoKey interface of the Web Crypto API.
 */
export async function deriveMasterKey(masterPassword: string, masterKeySalt: Uint8Array) {
  const keyBits = await deriveKeyBits(masterPassword, masterKeySalt);

  return crypto.subtle.importKey(
    "raw",
    keyBits,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
  );
}

/**
 * Decrypts a file using the master key and metadata
 * @param encryptedBlob The encrypted file to decrypt
 * @param unwrappingKey The crypto key to decrypt the `metadata.wrappedFileKey` with
 * @param metadata The metadata to use for the decryption
 * @returns The decrypted file
 */
export function decryptFile(
  encryptedBlob: Blob,
  unwrappingKey: CryptoKey,
  metadata: {
    fileIv: string;
    wrappedFileKey: string;
    keyWrapIv: string;
  }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./decryptFileWorker.ts", import.meta.url)
    );
    worker.onmessage = (event) => {
      const decryptedBuffer = event.data;
      const decryptedBlob = new Blob([decryptedBuffer]);
      resolve(decryptedBlob);
      worker.terminate();
    };
    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };
    worker.postMessage({ encryptedBlob, unwrappingKey, metadata });
  });
}

export function encryptFile(
  file: File,
  masterKey: CryptoKey,
  masterKeySalt: string
) {
  return new Promise<{
    encryptedFileBlob: Blob;
    metadata: {
      fileIv: string;
      wrappedFileKey: string;
      keyWrapIv: string;
      fileAlgorithm: string;
      keyDerivationSalt: string;
      argon2MemorySize: number;
      argon2Iterations: number;
      argon2Parallelism: number;
      argon2HashLength: number;
    };
  }>((resolve, reject) => {
    const worker = new Worker(
      new URL("./encryptFileWorker.ts", import.meta.url)
    );
    worker.onmessage = (event) => {
      const { encryptedContent, metadata } = event.data;
      const encryptedFileBlob = new Blob([encryptedContent], { type: 'application/octet-stream' });
      resolve({ encryptedFileBlob, metadata });
      worker.terminate();
    };
    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };
    worker.postMessage({ file, masterKey, masterKeySalt });
  });
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
 * @param wrappedKey The wrapped file key to be rewrapped (base64 encoded)
 * @param wrappedKeyIv The IV that was used to wrap [wrappedKey] (base64 encoded)
 * @param unwrappingKey The key that will be used to unwrap [wrappedKey]
 * @param wrappingKey The new key that will be used to wrap [wrappedKey]
 * 
 * @returns The file key wrapped with the new key, and the metadata used 
 * for the new key wrapping both encoded in base64
 */
export async function rewrapKey({
  wrappedKey,
  wrappedKeyIv,
  unwrappingKey,
  wrappingKey,
}: {
  wrappedKey: string,
  wrappedKeyIv: string,
  unwrappingKey: CryptoKey,
  wrappingKey: CryptoKey
}): Promise<{
  wrappedKey: string;
  wrappedKeyIv: string;
}> {
  // 1. Unwrap the file key using the master key
  const wrappedKeyBytes = base64ToUint8Array(wrappedKey);
  const wrappedKeyIvBytes = base64ToUint8Array(wrappedKeyIv);

  const key = await crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBytes,
    unwrappingKey,
    { name: "AES-GCM", iv: wrappedKeyIvBytes },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Generate a new IV for wrapping with the share key
  const newKeyWrapIv = generateIv();

  // 3. Wrap the file key with the share key
  const rewrappedKey = await crypto.subtle.wrapKey(
    "raw",
    key,
    wrappingKey,
    { name: "AES-GCM", iv: newKeyWrapIv }
  );

  return {
    wrappedKey: uint8ToBase64(new Uint8Array(rewrappedKey)),
    wrappedKeyIv: uint8ToBase64(newKeyWrapIv),
  };
}

/**
 * Derives a cryptographic key from a password and salt using argon2id
 * 
 * @param password The password to derive the key from
 * @param salt The salt to use for the key derivation
 * 
 * @returns The derived key as a Uint8Array
 */
async function deriveKeyBits(password: string, salt: Uint8Array) {
  const keyHex = await argon2id({
    password: password,
    salt: salt,
    parallelism: ARGON2_PARALLELISM,
    iterations: ARGON2_ITERATIONS,
    memorySize: ARGON2_MEMORY_SIZE,
    hashLength: ARGON2_HASH_LENGTH,
    outputType: "hex",
  });

  const keyBytes = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  return keyBytes;
}