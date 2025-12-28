"use server";

import { getSignedDownloadUrl, getSignedUploadUrl, deleteFileFromCloudStorage, doesFileExistInCloudStorage } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/user/getUser";
import { getSessionToken } from "@/lib/session/getSessionToken";
import * as opaqueServer from "@/lib/opaque/server";

/**
 * Generates a URL for uploading a file to cloud storage.
 * @returns An object containing the upload URL and storage path.
 */
export async function getUploadUrl() {
  const currentUser = await getUser();
  if (!currentUser) throw new Error("User not authenticated");

  // Generate a unique storage path with UUID to prevent collisions
  const uuid = crypto.randomUUID();
  const storagePath = `uploads/${currentUser.id}/${uuid}.enc`;

  // Generate a signed URL valid for 15 minutes
  const uploadUrl = await getSignedUploadUrl(storagePath);

  return {
    uploadUrl,
    storagePath,
  };
}

/**
 * Saves the details of an encrypted file to the database. The client should handle uploading the file to
 * cloud storage and call this function when that succeeds.
 * @param fileName The name of the file.
 * @param storagePath The path where the file will be stored. 
 * It must be of the form `uploads/{userId}/{uuid}.enc`.
 * @param fileSize The size of the file in bytes.
 * @param metadata The metadata for the file.
 */
export async function saveEncryptedFileDetails(
  fileName: string,
  storagePath: string,
  fileSize: number,
  metadata: {
    fileIv: string;
    wrappedFileKey: string;
    keyWrapIv: string;
    fileAlgorithm: string;
  }
) {
  const currentUser = await getUser();
  if (!currentUser) throw new Error("User not authenticated");

  // Verify the storage path belongs to this user
  if (!storagePath.startsWith(`uploads/${currentUser.id}/`)) {
    throw new Error("Invalid storage path");
  }

  // Verify the file exists at the storage path
  const exists = await doesFileExistInCloudStorage(storagePath);
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
    }
  });
  revalidatePath("/vault");
}

/**
 * Gets a download URL for a file by its ID.
 * @param fileId The unique ID of the file.
 * @returns The download URL.
 */
export async function getDownloadUrlByFileId(fileId: string) {
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

  return await getSignedDownloadUrl(fileRecord.storagePath);
}

/**
 * Deletes a file by its ID.
 * @param fileId The unique ID of the file.
 */
export async function deleteFile(fileId: string) {
  const currentUser = await getUser();
  if (!currentUser) throw new Error("User not authenticated");

  // Get the file record to ensure it belongs to this user
  const fileRecord = await prisma.encryptedFile.findUnique({
    where: {
      id: fileId,
      userId: currentUser.id,
    },
  });

  if (!fileRecord) {
    throw new Error("File not found or unauthorized");
  }

  // Delete from Firebase Storage
  await deleteFileFromCloudStorage(fileRecord.storagePath);

  // Delete from database
  await prisma.encryptedFile.delete({
    where: { id: fileId },
  });

  revalidatePath("/vault");
}

/**
 * Renames a file by its ID.
 * @param fileId The unique ID of the file.
 * @param newFileName The new name for the file.
 */
export async function renameFile(fileId: string, newFileName: string) {
  const sessionToken = await getSessionToken();
  if (!sessionToken) {
    throw new Error("Unauthorized");
  }

  // Get the session and user so we can verify the file belongs to this user
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
    throw new Error("File not found or unauthorized");
  }

  // Update the file name in the database
  await prisma.encryptedFile.update({
    where: { id: fileId },
    data: { fileName: newFileName },
  });

  revalidatePath("/vault");
}

/**
 * Starts OPAQUE login for an already-authenticated user (for re-verifying password).
 * This is used when the client needs to verify the password to derive the master key.
 * 
 * @param startLoginRequest - The OPAQUE start login request from the client
 * @returns loginResponse if successful, null if failed
 */
export async function createSignInResponseForSession(
  startLoginRequest: string
): Promise<{ loginResponse: string } | null> {
  const user = await getUser();
  if (!user || !user.opaqueRegistrationRecord) {
    return null;
  }

  const { loginResponse, serverLoginState } = await opaqueServer.createSignInResponse(
    user.email,
    user.opaqueRegistrationRecord,
    startLoginRequest
  );

  // Store the server login state as ephemeral
  await prisma.opaqueEphemeral.upsert({
    where: { userIdentifier: user.email },
    update: {
      serverLoginState,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
    create: {
      userIdentifier: user.email,
      serverLoginState,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  return { loginResponse };
}

/**
 * Finishes OPAQUE login for an already-authenticated user.
 * This verifies the password is correct without creating a new session.
 * 
 * @param finishLoginRequest - The OPAQUE finish login request from the client
 * @returns boolean - true if password verification succeeded
 */
export async function verifyPasswordForSession(
  finishLoginRequest: string
): Promise<boolean> {
  const user = await getUser();
  if (!user) {
    return false;
  }

  const ephemeral = await prisma.opaqueEphemeral.findUnique({
    where: { userIdentifier: user.email },
  });

  if (!ephemeral || ephemeral.expiresAt < new Date()) {
    if (ephemeral) {
      await prisma.opaqueEphemeral.delete({
        where: { id: ephemeral.id },
      });
    }
    return false;
  }

  const sessionKey = await opaqueServer.finishSignIn(
    ephemeral.serverLoginState,
    finishLoginRequest
  );

  await prisma.opaqueEphemeral.delete({
    where: { id: ephemeral.id },
  });

  return sessionKey !== null;
}