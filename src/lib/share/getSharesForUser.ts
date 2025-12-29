import { getSessionToken } from "@/lib/session/getSessionToken"
import { prisma } from "@/lib/db"

export async function getSharesForUser() {
  const sessionToken = await getSessionToken()
  if (!sessionToken) return null

  const session = await prisma.session.findUnique({
    where: {
      sessionToken
    },
    include: {
      user: {
        include: {
          encryptedFiles: {
            include: {
              shares: {
                include: {
                  file: {
                    select: {
                      fileName: true,
                      fileSize: true
                    }
                  }
                },
                orderBy: {
                  createdAt: "desc"
                }
              }
            }
          }
        }
      }
    }
  })

  if (!session) return null

  return session.user.encryptedFiles.map((encryptedFile) => encryptedFile.shares).flat()
}