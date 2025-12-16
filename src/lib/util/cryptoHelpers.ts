/**
 * When you derive a new key from a password you need to add some uniqueness to
 * prevent precomputed "rainbow table" attacks. This function generates a random
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
