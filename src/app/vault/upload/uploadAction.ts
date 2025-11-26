"use server";
import { prisma } from "../../../lib/db";
import { storage } from "../../../lib/firebaseAdmin";
import { getUser } from "../../../lib/getUser";

export async function uploadAction(
  fileName: string,
  cypherText: Blob,
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
  if (!currentUser) throw new Error("User not authenticated")

  const buffer = Buffer.from(await cypherText.arrayBuffer())
  const destination = `uploads/${currentUser.id}/${fileName}.enc`
  await saveToFirebaseStorage(destination, buffer)

  await prisma.encryptedFile.create({
    data: {
      userId: currentUser.id,
      fileName: fileName,
      fileSize: buffer.length,
      storagePath: destination,
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
}

async function saveToFirebaseStorage(destination: string, buffer: Buffer<ArrayBuffer>) {
  const fileRef = storage.file(destination);
  await fileRef.save(buffer, {
    metadata: { contentType: "application/octet-stream" },
    resumable: false,
  });
}
