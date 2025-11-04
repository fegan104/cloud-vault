import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function getUser() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  try {
    return await adminAuth.verifySessionCookie(session, true);
  } catch {
    return null;
  }
}
