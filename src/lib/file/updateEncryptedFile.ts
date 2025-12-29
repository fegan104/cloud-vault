import { prisma } from "@/lib/db";

/**
 * Renames an encrypted file.
 * 
 * @param fileId - The ID of the file to rename
 * @param newFileName - The new name for the file
 */
export async function renameEncryptedFile(fileId: string, newFileName: string) {
  return await prisma.encryptedFile.update({
    where: { id: fileId },
    data: { fileName: newFileName },
  });
}

/**
 * Updates encryption parameters for an encrypted file.
 * 
 * @param fileId - The ID of the file
 * @param userId - The ID of the user (for security)
 * @param wrappedFileKey - The new wrapped file key
 * @param keyWrapIv - The new IV used for wrapping the file key
 */
export async function updateEncryptedFileKeyParams(
  fileId: string,
  userId: string,
  wrappedFileKey: string,
  keyWrapNonce: string
) {
  return await prisma.encryptedFile.update({
    where: {
      id: fileId,
      userId,
    },
    data: {
      wrappedFileKey,
      keyWrapNonce,
    },
  });
}
