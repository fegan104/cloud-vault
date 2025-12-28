import { base64ToUint8Array } from "./arrayHelpers";

self.onmessage = async (e) => {
  const { encryptedBlob, unwrappingKey, metadata } = e.data;

  // 1. Unwrap the file key using the unwrapping key
  const wrappedKeyBytes = base64ToUint8Array(metadata.wrappedFileKey);
  const keyWrapNonceBytes = base64ToUint8Array(metadata.keyWrapNonce);

  const fileKey = await crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBytes,
    unwrappingKey,
    { name: "AES-GCM", iv: keyWrapNonceBytes },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Decrypt the file content
  const fileNonceBytes = base64ToUint8Array(metadata.fileNonce);
  const encryptedBuffer = await encryptedBlob.arrayBuffer();

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fileNonceBytes },
    fileKey,
    encryptedBuffer
  );

  self.postMessage(decryptedBuffer, [decryptedBuffer] as WindowPostMessageOptions);
};
