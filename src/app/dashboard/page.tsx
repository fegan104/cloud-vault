import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/getUser";
import { storage } from "@/lib/firebaseAdmin";
import DashboardClient from "./DashboardClient";

export default async function Dashboard() {
  const sessionToken = (await cookies()).get("session")?.value
  if (!sessionToken) {
    redirect("/")
  }
  const user = await getUser();
  if (!user) {
    redirect("/")
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

  if (!userWithFiles) {
    redirect("/")
  }

  // Generate signed URLs for each file
  const filesWithUrls = await Promise.all(
    userWithFiles.user.encryptedFiles.map(async (file) => {
      const [url] = await storage.file(file.storagePath).getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60, // 1 hour
      });
      return {
        ...file,
        downloadUrl: url,
      };
    })
  );

  return (
    <DashboardClient
      masterKeySalt={user.masterKeySalt}
      files={filesWithUrls}
    />
  );
}