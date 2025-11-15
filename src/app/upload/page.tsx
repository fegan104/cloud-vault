// app/upload/page.tsx (Server Component)
import { storage } from "@/lib/firebaseAdmin";
import { getUser } from "@/lib/getUser";
import { UploadScreenContent } from "./UploadScreenContent";

export default async function UploadPage() {
  const user = await getUser();
  if (!user) return <p>Please log in</p>;

  // user is now non-null inside this scope
  async function uploadAction(fileName: string, cypherText: Blob) {
    "use server";

    const currentUser = await getUser();
    if (!currentUser) throw new Error("User not authenticated")

    const buffer = Buffer.from(await cypherText.arrayBuffer())
    const destination = `uploads/${currentUser.uid}/${fileName}.enc`

    const fileRef = storage.file(destination);
    await fileRef.save(buffer, {
      metadata: { contentType: "application/octet-stream" },
      resumable: false,
    });
  }

  return (
    <div>
      <UploadScreenContent onEncrypted={uploadAction}/>
    </div>
  );
}