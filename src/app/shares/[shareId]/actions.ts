"use server"

import { prisma } from "@/lib/db"
import { storage } from "@/lib/firebaseAdmin";
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

export async function getShareDownloadUrl(shareId: string): Promise<string> {
  const share = await prisma.share.findUnique({
    where: {
      id: shareId,
    },
    include: {
      file: true,
    },
  });

  if (!share || !share.file) {
    throw new Error("Share or file not found");
  }

  // Generate a signed URL valid for 15 minutes
  const [url] = await storage.file(share.file.storagePath).getSignedUrl({
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000,
  });

  return url;
}
