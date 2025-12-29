import { prisma } from "@/lib/db";

/**
 * Gets an encrypted file by its ID and user ID for authorization.
 * 
 * @param fileId - The ID of the file
 * @param userId - The ID of the user to verify ownership
 */
export async function getEncryptedFileById(fileId: string, userId: string) {
  return await prisma.encryptedFile.findUnique({
    where: {
      id: fileId,
      userId: userId,
    },
  });
}

/**
 * Gets all encrypted files for a user.
 * 
 * @param userId - The ID of the user
 * @returns An array of file records
 */
export async function getEncryptedFilesForUser(userId: string) {
  return await prisma.encryptedFile.findMany({
    where: { userId },
    select: {
      id: true,
      wrappedFileKey: true,
      keyWrapNonce: true,
    },
  });
}
