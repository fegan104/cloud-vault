import { cookies } from "next/headers";

/**
 * Deletes the session cookie.
 */
export async function deleteSessionToken() {
  (await cookies()).delete("session")
}