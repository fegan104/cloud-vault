"use server"
import { getSessionToken } from "@/lib/session/getSessionToken"
import { deleteShareAuthorized } from "@/lib/share/deleteShare"
import { revalidatePath } from "next/cache"

/**
 * Delete a share by ID
 * @param shareId The ID of the share to delete
 */
export async function deleteShare(shareId: string) {
  const sessionToken = await getSessionToken()
  if (!sessionToken) throw new Error("Unauthorized")

  await deleteShareAuthorized(shareId, sessionToken)

  revalidatePath("/shares")
}