import { uint8ToBase64 } from "./arrayHelpers";

const ARGON2_MEMORY_SIZE = 131_072; // 128 MB
const ARGON2_ITERATIONS = 4;
const ARGON2_PARALLELISM = 1;
const ARGON2_HASH_LENGTH = 32;

self.onmessage = async (e) => {
  const { file, masterKey, masterKeySalt, fileIv, keyWrapIv } = e.data;

  const fileBuffer = await file.arrayBuffer();

  // 1. Generate a random file key
  const fileKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // 2. Encrypt the file with the file key
  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: fileIv },
    fileKey,
    fileBuffer
  );

  // 3. Wrap the file key with the master key
  const wrappedFileKey = await crypto.subtle.wrapKey(
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

  self.postMessage({ encryptedContent, metadata }, [encryptedContent] as WindowPostMessageOptions);
};
