"use server"
import { prisma } from "@/lib/db"
import { getSessionToken } from "@/lib/session/getSessionToken"
import { revalidatePath } from "next/cache"

/**
 * Delete a share by ID
 * @param shareId The ID of the share to delete
 */
export async function deleteShare(shareId: string) {
  const sessionToken = await getSessionToken()
  if (!sessionToken) throw new Error("Unauthorized")

  // Ensure the user is authorized to delete the share
  const share = await prisma.share.findFirst({
    where: {
      id: shareId,
      file: {
        user: {
          sessions: {
            some: {
              sessionToken
            }
          }
        }
      }
    }
  })

  if (!share) {
    throw new Error("Share not found or unauthorized")
  }

  await prisma.share.delete({
    where: {
      id: shareId
    }
  })
  revalidatePath("/shares")
}