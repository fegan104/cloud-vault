import { prisma } from "@/lib/db";
import { User } from "@prisma/client";

/**
 * Creates a new user in the database.
 * 
 * @param email - The user's email address
 * @param registrationRecord - The OPAQUE registration record
 * @returns The created user
 */
export async function createUser(
  email: string,
  registrationRecord: string
): Promise<User> {
  return await prisma.user.create({
    data: {
      email,
      opaqueRegistrationRecord: registrationRecord,
    },
  });
}
