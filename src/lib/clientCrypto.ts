import nacl from "tweetnacl";

//TODO
// const { publicKey, privateKey } = await crypto.subtle.generateKey(
//       { name: 'Ed25519' },
//       true,
//       ['sign', 'verify']
//     );
export async function deriveKeypair(password: string, salt: Uint8Array<ArrayBuffer>) {
  const pwBytes = new TextEncoder().encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    pwBytes,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const seed = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 200_000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  // Convert seed → Ed25519 keypair using TweetNaCl
  const keypair = nacl.sign.keyPair.fromSeed(new Uint8Array(seed));

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
  console.log(`PublicKey = ${uint8ToBase64(keyPairs.publicKey)}, PrivateKey=${uint8ToBase64(keyPairs.privateKey)}, challenge=${challenge}}`)

  const messageBytes = encoder.encode(challenge);
  const sig = nacl.sign.detached(messageBytes, keyPairs.privateKey);
  return uint8ToBase64(sig);
}

function uint8ToBase64(u8: Uint8Array): string {
  // Convert bytes → binary string → base64
  let binary = "";
  for (let i = 0; i < u8.length; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  return btoa(binary);
}


// export async function signChallenge(
//   password: string,
//   masterKeySaltB64: string,
//   challenge: string
// ) {
//   const encoder = new TextEncoder();

//   // 1. derive master key (HMAC key)
//   const masterKey = await deriveMasterKey(password, masterKeySaltB64);

//   // 2. sign the challenge
//   const signature = await crypto.subtle.sign(
//     "HMAC",
//     masterKey,
//     encoder.encode(challenge)
//   );

//   // 3. return base64 signature
//   return btoa(String.fromCharCode(...new Uint8Array(signature)));
// }

// Derive a key from password + salt using PBKDF2 → HMAC-SHA256
// export async function deriveMasterKey(password: string, masterKeySaltB64: string) {
//   const encoder = new TextEncoder();
//   const pwdKey = await crypto.subtle.importKey(
//     "raw",
//     encoder.encode(password),
//     { name: "PBKDF2" },
//     false,
//     ["deriveKey"]
//   );

//   return crypto.subtle.deriveKey(
//     {
//       name: "PBKDF2",
//       salt: Uint8Array.from(atob(masterKeySaltB64), c => c.charCodeAt(0)),
//       iterations: 310000,
//       hash: "SHA-256",
//     },
//     pwdKey,
//     { name: "HMAC", hash: "SHA-256", length: 256 },
//     false,
//     ["sign"]
//   );
// }

export function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64); // Decode the Base64 string to a binary string
  const len = binaryString.length;
  const bytes = new Uint8Array(len); // Create a new Uint8Array with the same length

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i); // Populate the Uint8Array with byte values
  }

  return bytes;
}