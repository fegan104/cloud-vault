"use server"

import { prisma } from "@/lib/db"
import { EncryptedFile, Share } from "@prisma/client";

export type ShareWithFile = {
  file: EncryptedFile;
} & Share;

export async function getShareById(shareId: string): Promise<ShareWithFile> {
  return await prisma.share.findUnique({
    where: {
      id: shareId,
    },
    include: {
      file: true,
    },
  }) as ShareWithFile;
}
