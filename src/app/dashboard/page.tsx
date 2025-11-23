import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const sessionToken = (await cookies()).get("session")?.value
  if (!sessionToken) {
    redirect("/")
    return
  }

  const userWithFiles = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        include: {
          encryptedFiles: true,
        },
      },
    },
  });

  return (
    <ul>
      {userWithFiles?.user.encryptedFiles.map((file) =>
        <li key={file.id}>{file.fileName} foudna @ {file.storagePath}</li>)
      }
    </ul>
  )
}