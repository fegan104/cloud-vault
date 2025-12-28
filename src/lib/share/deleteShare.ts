import { prisma } from "@/lib/db";

/**
 * Deletes a share after verifying that the requesting user owns the associated file.
 * 
 * @param shareId - The ID of the share to delete
 * @param sessionToken - The session token of the requesting user
 * @throws {Error} if the share is not found or the user is unauthorized
 */
export async function deleteShareAuthorized(shareId: string, sessionToken: string) {
  const share = await prisma.share.findFirst({
    where: {
      id: shareId,
      file: {
        user: {
          sessions: {
            some: {
              sessionToken
            }
          }
        }
      }
    }
  });

  if (!share) {
    throw new Error("Share not found or unauthorized");
  }

  return await prisma.share.delete({
    where: { id: shareId },
  });
}
