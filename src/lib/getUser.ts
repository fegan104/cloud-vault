import { cookies } from "next/headers";
import { prisma } from "./db";

export async function getUser() {
  const sessionToken = (await cookies()).get("session")?.value;
  if (!sessionToken) return null;
  const session = await prisma.session.findUnique({
    where: {
      sessionToken,
      expiresAt: {
        gt: new Date(), // only include sessions that haven't expired
      }
    },
    include: { user: true },
  });

  if (!session) return null;

  try {
    return session.user;
  } catch {
    return null;
  }
}
