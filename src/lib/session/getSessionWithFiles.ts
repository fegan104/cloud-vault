import { prisma } from "@/lib/db";

/**
 * Gets a session with the associated user and a specific encrypted file if it belongs to that user.
 * 
 * @param sessionToken - The session token
 * @param fileId - The ID of the file to include
 * @returns The session object or null
 */
export async function getSessionWithFile(sessionToken: string, fileId: string) {
  return await prisma.session.findUnique({
    where: {
      sessionToken,
      expiresAt: {
        gt: new Date(),
      }
    },
    include: {
      user: {
        include: {
          encryptedFiles: {
            where: {
              id: fileId,
            },
          }
        },
      },
    },
  });
}
