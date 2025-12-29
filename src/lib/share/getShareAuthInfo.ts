import { prisma } from "@/lib/db";

/**
 * Gets authentication information for a share.
 * 
 * @param shareId - The ID of the share
 * @returns The share name and OPAQUE registration record or null
 */
export async function getShareAuthInfo(shareId: string) {
  return await prisma.share.findUnique({
    where: { id: shareId },
    select: {
      name: true,
      opaqueRegistrationRecord: true,
    }
  });
}
