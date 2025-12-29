"use server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * Deletes the session cookie and the session from the database.
 */
export async function deleteSessionToken() {
  const requestCookies = await cookies();
  const sessionToken = requestCookies.get("session")?.value;
  requestCookies.delete("session")
  if (!sessionToken) return;
  try {
    await prisma.session.delete({ where: { sessionToken } })
  } catch (error) {
    console.log(error)
  }
}