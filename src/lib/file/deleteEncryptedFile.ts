import { prisma } from "@/lib/db";

/**
 * Deletes an encrypted file record from the database.
 * 
 * @param fileId - The ID of the file to delete
 */
export async function deleteEncryptedFile(fileId: string) {
  return await prisma.encryptedFile.delete({
    where: { id: fileId },
  });
}
