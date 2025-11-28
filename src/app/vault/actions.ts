"use server";

import { storage } from "../../lib/firebaseAdmin";
import { prisma } from "../../lib/db";
import { getSessionToken } from "../../lib/getSessionToken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "../../lib/getUser";

export async function getUploadUrl(fileName: string) {
  const currentUser = await getUser();
  if (!currentUser) throw new Error("User not authenticated");

  // Generate a unique storage path with UUID to prevent collisions
  const uuid = crypto.randomUUID();
  const storagePath = `uploads/${currentUser.id}/${uuid}-${fileName}.enc`;

  // Generate a signed URL valid for 15 minutes
  const [uploadUrl] = await storage.file(storagePath).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: 'application/octet-stream',
  });

  return {
    uploadUrl,
    storagePath,
  };
}

export async function uploadAction(
  fileName: string,
  storagePath: string,
  fileSize: number,
  metadata: {
    fileIv: string;
    wrappedFileKey: string;
    keyWrapIv: string;
    fileAlgorithm: string;
    keyDerivationSalt: string;
    keyDerivationIterations: number;
    keyDerivationAlgorithm: string;
    keyDerivationHash: string;
  }
) {
  const currentUser = await getUser();
  if (!currentUser) throw new Error("User not authenticated");

  // Verify the storage path belongs to this user
  if (!storagePath.startsWith(`uploads/${currentUser.id}/`)) {
    throw new Error("Invalid storage path");
  }

  // Verify the file exists at the storage path
  const fileRef = storage.file(storagePath);
  const [exists] = await fileRef.exists();
  if (!exists) {
    throw new Error("File not found at storage path");
  }

  await prisma.encryptedFile.create({
    data: {
      userId: currentUser.id,
      fileName: fileName,
      fileSize: fileSize,
      storagePath: storagePath,
      fileIv: metadata.fileIv,
      fileAlgorithm: metadata.fileAlgorithm,
      wrappedFileKey: metadata.wrappedFileKey,
      keyWrapIv: metadata.keyWrapIv,
      keyDerivationSalt: metadata.keyDerivationSalt,
      keyDerivationIterations: metadata.keyDerivationIterations,
      keyDerivationAlgorithm: metadata.keyDerivationAlgorithm,
      keyDerivationHash: metadata.keyDerivationHash,
    }
  });
  revalidatePath("/vault");
}

export async function getDownloadUrl(fileId: string) {
  const sessionToken = await getSessionToken();
  if (!sessionToken) {
    throw new Error("Unauthorized");
  }

  const session = await prisma.session.findUnique({
    where: {
      sessionToken,
      expiresAt: {
        gt: new Date(), // only include sessions that haven't expired
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

  const fileRecord = session?.user.encryptedFiles?.[0];

  if (!fileRecord) {
    throw new Error("File not found");
  }

  // Generate a signed URL valid for 15 minutes
  const [url] = await storage.file(fileRecord.storagePath).getSignedUrl({
    action: 'read',
    expires: Date.now() + 15 * 60 * 1000,
  });

  return url;
}

export async function signOut() {
  const requestCookies = await cookies();
  const sessionToken = requestCookies.get("session")?.value;
  await prisma.session.delete({ where: { sessionToken } })
  requestCookies.delete("session");
  redirect("/");
}