import { prisma } from "@/lib/db";

export async function getUserWithFiles(sessionToken: string) {
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
    throw new Error("Unauthorized");
  }

  return session.user;
}
