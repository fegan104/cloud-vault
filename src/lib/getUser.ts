import { prisma } from "./db";
import { getSessionToken } from "./getSessionToken";

export async function getUser() {
  const sessionToken = await getSessionToken();
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
