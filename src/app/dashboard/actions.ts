"use server";

import { storage } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/getUser";

export async function getEncryptedFile(fileId: string) {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const fileRecord = await prisma.encryptedFile.findUnique({
    where: { id: fileId },
  });

  if (!fileRecord) {
    throw new Error("File not found");
  }

  if (fileRecord.userId !== user.id) {
    throw new Error("Forbidden");
  }

  const fileRef = storage.file(fileRecord.storagePath);
  const [exists] = await fileRef.exists();

  if (!exists) {
    throw new Error("File not found in storage");
  }

  const [buffer] = await fileRef.download();

  // Convert buffer to base64 string to be serializable
  return buffer.toString('base64');
}
