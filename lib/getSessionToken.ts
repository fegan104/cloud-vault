import { cookies } from "next/headers";

export async function getSessionToken() {
  const sessionToken = (await cookies()).get("session")?.value;
  if (!sessionToken) return null;
  return sessionToken;
}