import { prisma } from "@/lib/db";
import { User } from "@prisma/client";

/**
 * Gets a user by their email address.
 * 
 * @param email - The email address to search for
 * @returns The user object or null if not found
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { email },
  });
}
