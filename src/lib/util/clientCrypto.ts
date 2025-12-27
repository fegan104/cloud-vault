import nacl from "tweetnacl";
import { base64ToUint8Array, uint8ToBase64 } from "./arrayHelpers";

const HKDF_SALT = new Uint8Array(0); // Standard OPAQUE/HKDF practice when salt is handled elsewhere

/**
 * Converts a hex string to a Uint8Array.
 */
function hexToUint8Array(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * When you derive a new key from a password you need to add some uniqueness to
 * prevent precomputed "rainbow table" attacks. This funciton generates a random
 * salt for use in the key derivation process.
 */
export function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * When using AES-GCM you need to generate a unique number-used-once (nonce). This is 
 * a "initialization vector" (IV) for each encryption operation. This allows us to 
 * reuse the same master key for identical files and still produce different ciphertexts.
 */
export function generateIv() {
  return crypto.getRandomValues(new Uint8Array(12));
}


/**
 * Imports a usable CryptoKey from an OPAQUE export key using HKDF.
 * This is required because the raw export key is not yet ready for use as an AES-256 key.
 * 
 * @param exportKeyHex - The OPAQUE export key in hex format
 * @param usage - The intended usage ('master' for user vault, 'share' for share access)
 * @returns A CryptoKey for AES-GCM 256
 */
export async function importKeyFromExportKey(
  exportKeyHex: string,
  usage: 'master' | 'share'
): Promise<CryptoKey> {
  const exportKeyBytes = hexToUint8Array(exportKeyHex);
  const info = new TextEncoder().encode(usage === 'master' ? "OPAQUE_MASTER_KEY" : "OPAQUE_SHARE_KEY");

  // 1. Import the raw bytes as a base key for HKDF
  const baseKey = await crypto.subtle.importKey(
    "raw",
    exportKeyBytes,
    { name: "HKDF" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // 2. Derive the final AES-GCM 256 key using HKDF
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: HKDF_SALT,
      info: info,
    },
    baseKey,
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
  masterKey: CryptoKey
) {
  return new Promise<{
    encryptedFileBlob: Blob;
    metadata: {
      fileIv: string;
      wrappedFileKey: string;
      keyWrapIv: string;
      fileAlgorithm: string;
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

    const fileIv = generateIv();
    const keyWrapIv = generateIv();

    worker.postMessage({ file, masterKey, fileIv, keyWrapIv });
  });
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
