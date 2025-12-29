import { prisma } from "@/lib/db";

/**
 * Updates a user's email address and OPAQUE registration record in a transaction.
 * 
 * @param userId - The ID of the user to update
 * @param email - The new email address
 * @param registrationRecord - The new OPAQUE registration record
 */
export async function updateUserEmailAndRegistration(userId: string, email: string, registrationRecord: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      email,
      opaqueRegistrationRecord: registrationRecord
    },
  });
}

/**
 * Updates a user's OPAQUE registration record.
 * 
 * @param userId - The ID of the user to update
 * @param registrationRecord - The new OPAQUE registration record
 */
export async function updateUserRegistrationRecord(userId: string, registrationRecord: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: { opaqueRegistrationRecord: registrationRecord },
  });
}

/**
 * Updates multiple encrypted file key params and the user's registration record in a transaction.
 * 
 * @param userId - The ID of the user
 * @param updates - Array of file updates
 * @param opaqueRegistrationRecord - The new registration record
 */
export async function updateEncryptedFilesTransaction(
  userId: string,
  updates: { id: string; wrappedFileKey: string; keyWrapNonce: string }[],
  opaqueRegistrationRecord: string
) {
  return await prisma.$transaction(
    [
      ...updates.map((update) =>
        prisma.encryptedFile.update({
          where: {
            id: update.id,
            userId: userId,
          },
          data: {
            wrappedFileKey: update.wrappedFileKey,
            keyWrapNonce: update.keyWrapNonce,
          },
        })
      ),
      prisma.user.update({
        where: { id: userId },
        data: { opaqueRegistrationRecord },
      }),
    ]
  );
}
