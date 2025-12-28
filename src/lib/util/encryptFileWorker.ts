import { uint8ToBase64 } from "./arrayHelpers";

const ARGON2_MEMORY_SIZE = 131_072; // 128 MB
const ARGON2_ITERATIONS = 4;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LENGTH = 32;

self.onmessage = async (e) => {
  const { file, masterKey, fileNonce, keyWrapNonce } = e.data;

  const fileBuffer = await file.arrayBuffer();

  // 1. Generate a random file key
  const fileKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // 2. Encrypt the file with the file key
  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: fileNonce },
    fileKey,
    fileBuffer
  );

  // 3. Wrap the file key with the master key
  const wrappedFileKey = await crypto.subtle.wrapKey(
    "raw",
    fileKey,
    masterKey,
    { name: "AES-GCM", iv: keyWrapNonce }
  );

  // 4. Prepare metadata
  // Note: keyDerivationSalt is kept for backward compatibility but no longer used
  // with OPAQUE export key - the master key is derived internally by OPAQUE
  const metadata = {
    fileNonce: uint8ToBase64(fileNonce),
    wrappedFileKey: uint8ToBase64(new Uint8Array(wrappedFileKey)),
    keyWrapNonce: uint8ToBase64(keyWrapNonce),
    fileAlgorithm: 'AES-GCM',
  };

  self.postMessage({ encryptedContent, metadata }, [encryptedContent] as WindowPostMessageOptions);
};
