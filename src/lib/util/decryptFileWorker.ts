import { base64ToUint8Array } from "./arrayHelpers";

self.onmessage = async (e) => {
  const { encryptedBlob, unwrappingKey, metadata } = e.data;

  // 1. Unwrap the file key using the unwrapping key
  const wrappedKeyBytes = base64ToUint8Array(metadata.wrappedFileKey);
  const keyWrapIvBytes = base64ToUint8Array(metadata.keyWrapIv);

  const fileKey = await crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBytes,
    unwrappingKey,
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

  self.postMessage(decryptedBuffer, [decryptedBuffer] as WindowPostMessageOptions);
};
