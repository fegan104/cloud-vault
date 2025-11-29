import { prisma } from "../../lib/db";
import { redirect } from "next/navigation";
import VaultScreen from "./VaultScreen";
import { getSessionToken } from "../../lib/getSessionToken";

export default async function Dashboard() {
  const sessionToken = await getSessionToken()
  if (!sessionToken) {
    redirect("/signin")
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
            orderBy: {
              createdAt: "desc",
            }
          }
        },
      },
    },
  });

  if (!session) {
    redirect("/signin")
  }

  return (
    <VaultScreen
      masterKeySalt={session.user.masterKeySalt}
      files={session.user.encryptedFiles}
    />
  );
}