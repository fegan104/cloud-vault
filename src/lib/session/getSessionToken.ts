import { cookies } from "next/headers";

/**
 * Get the session token from the cookie.
 * @returns The session token or null if not found.
 */
export async function getSessionToken() {
  const sessionToken = (await cookies()).get("session")?.value;
  return sessionToken || null;
}