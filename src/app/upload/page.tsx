// app/upload/page.tsx (Server Component)
import { storage } from "@/lib/firebaseAdmin";
import { getUser } from "@/lib/getUser";
import { prisma } from "@/lib/db";
import { UploadScreenContent } from "./UploadScreenContent";

export default async function UploadPage() {
  const user = await getUser();
  if (!user) return <p>Please log in</p>;

  // user is now non-null inside this scope
  async function uploadAction(
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
    "use server";

    const currentUser = await getUser();
    if (!currentUser) throw new Error("User not authenticated")

    const buffer = Buffer.from(await cypherText.arrayBuffer())
    const destination = `uploads/${currentUser.id}/${fileName}.enc`

    const fileRef = storage.file(destination);
    await fileRef.save(buffer, {
      metadata: { contentType: "application/octet-stream" },
      resumable: false,
    });

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

  return (
    <div>
      <UploadScreenContent masterKeySalt={user.masterKeySalt} onEncrypted={uploadAction} />
    </div>
  );
}