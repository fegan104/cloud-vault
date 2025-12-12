"use server"

import { getShareById } from "@/lib/share";
import { getSignedDownloadUrl } from "@/lib/firebaseAdmin";

/**
 * Get a signed URL for a share that can be used to download the file.
 * @param shareId The uniqueID of the share to get.
 * @returns The download URL for the share. */
export async function getShareDownloadUrl(shareId: string): Promise<string> {
  const share = await getShareById(shareId);

  if (!share || !share.file) {
    throw new Error("Share or file not found");
  }

  return await getSignedDownloadUrl(share.file.storagePath);
}
