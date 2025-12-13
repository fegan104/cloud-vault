"use server";
import { EncryptedFile, Share } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ShareWithFile = {
  file: EncryptedFile;
} & Share;

/**
 * Get a share by its ID.
 * @param shareId The uniqueID of the share to get.
 * @returns The share with its associated file or null if not found.
 */
export async function getShareById(shareId: string): Promise<ShareWithFile | null> {
  return await prisma.share.findUnique({
    where: {
      id: shareId,
    },
    include: {
      file: true,
    },
  }) as ShareWithFile;
}