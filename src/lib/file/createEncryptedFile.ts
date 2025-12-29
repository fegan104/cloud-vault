import { prisma } from "@/lib/db";

interface FileMetadata {
  fileNonce: string;
  wrappedFileKey: string;
  keyWrapNonce: string;
}

/**
 * Saves encryption details for a file to the database.
 * 
 * @param userId - The ID of the user who owns the file
 * @param fileName - The original file name
 * @param fileSize - The size of the file in bytes
 * @param storagePath - The path in cloud storage
 * @param metadata - Encryption metadata
 */
export async function createEncryptedFile(
  userId: string,
  fileName: string,
  fileSize: number,
  storagePath: string,
  metadata: FileMetadata
) {
  return await prisma.encryptedFile.create({
    data: {
      userId,
      fileName,
      fileSize,
      storagePath,
      fileNonce: metadata.fileNonce,
      wrappedFileKey: metadata.wrappedFileKey,
      keyWrapNonce: metadata.keyWrapNonce,
    },
  });
}
