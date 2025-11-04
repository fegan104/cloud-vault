// app/upload/page.tsx (Server Component)
import { storage } from "@/lib/firebaseAdmin";
import { getUser } from "@/lib/getUser";

export default async function UploadPage() {
  const user = await getUser();
  if (!user) return <p>Please log in</p>;

  // Server Action
  async function uploadAction(formData: FormData) {
    "use server";

    const file = formData.get("file") as File | null;
    if (!file) throw new Error("No file selected");

    const buffer = Buffer.from(await file.arrayBuffer());

    const destination = `uploads/${user.uid}/${file.name}`;
    const fileRef = storage.file(destination);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
      resumable: false,
    });

    return destination;
  }

  return (
    <div>
      <h1>Upload File</h1>
      <form action={uploadAction}>
        <input type="file" name="file" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Upload
        </button>
      </form>
    </div>
  );
}
