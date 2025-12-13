import { getSessionToken } from "./session";
import { prisma } from "./db";
import { User } from "@prisma/client";


/**
 * Gets the user from the database using the session token.
 * @returns The user object if found, otherwise null.
 */
export async function getUser(): Promise<User | null> {
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

  return session?.user || null;
}
