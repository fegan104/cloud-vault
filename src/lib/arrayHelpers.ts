/**
 * Converts a base64 encoded string to a uint8 array
 */
export function base64ToUint8Array(b64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Converts a uint8 array to a base64 encoded string
 */
export function uint8ToBase64(u8: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < u8.length; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  return btoa(binary);
}