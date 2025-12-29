import { prisma } from "@/lib/db";

/**
 * Upserts the OPAQUE server login state for a user.
 * 
 * @param userIdentifier - The identifier for the user (email or shareId)
 * @param serverLoginState - The OPAQUE server login state to store
 * @param expiresAt - Optional expiration date, defaults to 5 minutes from now
 */
export async function upsertEphemeral(
  userIdentifier: string,
  serverLoginState: string,
  expiresAt: Date = new Date(Date.now() + 5 * 60 * 1000)
) {
  return await prisma.opaqueEphemeral.upsert({
    where: { userIdentifier },
    update: {
      serverLoginState,
      expiresAt,
    },
    create: {
      userIdentifier,
      serverLoginState,
      expiresAt,
    },
  });
}

/**
 * Gets the OPAQUE ephemeral state for a user.
 * 
 * @param userIdentifier - The identifier for the user
 * @returns The ephemeral state or null if not found
 */
export async function getEphemeral(userIdentifier: string) {
  return await prisma.opaqueEphemeral.findUnique({
    where: { userIdentifier },
  });
}

/**
 * Deletes the OPAQUE ephemeral state for a user.
 * 
 * @param id - The ID of the ephemeral record
 */
export async function deleteEphemeral(id: string) {
  return await prisma.opaqueEphemeral.delete({
    where: { id },
  });
}
