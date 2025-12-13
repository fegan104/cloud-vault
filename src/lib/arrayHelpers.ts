export function base64ToUint8Array(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function uint8ToBase64(u8: Uint8Array): string {
  // Convert bytes → binary string → base64
  let binary = "";
  for (let i = 0; i < u8.length; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  return btoa(binary);
}

// export function base64ToUint8Array(base64: string) {
//   const binaryString = atob(base64); // Decode the Base64 string to a binary string
//   const len = binaryString.length;
//   const bytes = new Uint8Array(len); // Create a new Uint8Array with the same length

//   for (let i = 0; i < len; i++) {
//     bytes[i] = binaryString.charCodeAt(i); // Populate the Uint8Array with byte values
//   }

//   return bytes;
// }