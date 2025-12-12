import { prisma } from "../../lib/db";
import { redirect } from "next/navigation";
import VaultScreen from "./VaultScreen";
import { getSessionToken, deleteSessionToken } from "../../lib/session";

export default async function Page() {
  const sessionToken = await getSessionToken()
  if (!sessionToken) {
    redirect("/signin")
  }

  // Query for a non-expired session and user's encrypted files
  const session = await prisma.session.findUnique({
    where: {
      sessionToken,
      expiresAt: {
        gt: new Date(),
      }
    },
    include: {
      user: {
        include: {
          encryptedFiles: {
            orderBy: {
              createdAt: "desc",
            }
          }
        },
      },
    },
  });

  if (!session) {
    // Delete the session token cookie in case one is leftover
    deleteSessionToken()
    redirect("/signin")
  } else {
    //extend the current valid session by 24 hours  
    await prisma.session.update({
      where: { sessionToken },
      data: {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })
  }

  return (
    <VaultScreen
      masterKeySalt={session.user.masterKeySalt}
      files={session.user.encryptedFiles}
    />
  );
}